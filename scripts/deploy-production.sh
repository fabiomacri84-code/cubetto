#!/usr/bin/env bash
# Run on the production host; no passwords are stored or passed as arguments.
set -Eeuo pipefail
umask 077
TAG=${1:-}
[[ "$TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo 'Usage: deploy-production.sh vX.Y.Z' >&2; exit 1; }
[[ $(id -u) == 0 ]] || { echo 'Root is required to manage the existing service.' >&2; exit 1; }
for tool in node npm git systemctl pg_dump pg_restore curl flock tar runuser createdb dropdb; do command -v "$tool" >/dev/null; done
[[ $(node -p 'process.versions.node.split(".")[0]') == 22 ]] || { echo 'Node 22 is required.' >&2; exit 1; }
exec 9>/run/lock/cubetto-release.lock
flock -n 9 || { echo 'Another deployment is running.' >&2; exit 1; }
SOURCE=/opt/cubetto
SERVICE=cubetto.service
RELEASE=/opt/cubetto-releases/$TAG
BACKUP=/opt/cubetto-backups/$(date -u +%Y%m%dT%H%M%SZ)-$TAG
OVERRIDE=/etc/systemd/system/$SERVICE.d/90-cubetto-release.conf
[[ -f "$SOURCE/.env" && -d "$SOURCE/uploads" ]] || { echo 'Existing production environment/uploads missing.' >&2; exit 1; }
ORIGIN=$(git -C "$SOURCE" remote get-url origin)
[[ "$ORIGIN" == https://github.com/fabiomacri84-code/cubetto.git || "$ORIGIN" == https://github.com/fabiomacri84-code/cubetto || "$ORIGIN" == git@github.com:fabiomacri84-code/cubetto.git ]] || { echo 'Unexpected original repository.' >&2; exit 1; }
[[ ! -e "$RELEASE" ]] || { echo 'Release directory already exists; inspect it before retrying.' >&2; exit 1; }
mkdir -p /opt/cubetto-releases "$BACKUP"
chmod 700 "$BACKUP"
chmod 755 /opt/cubetto-releases
git -C "$SOURCE" fetch origin "refs/tags/$TAG:refs/tags/$TAG"
[[ $(git -C "$SOURCE" cat-file -t "$TAG") == tag ]] || { echo 'An annotated tag is required.' >&2; exit 1; }
COMMIT=$(git -C "$SOURCE" rev-parse "$TAG^{commit}")
mkdir "$RELEASE"
chmod 755 "$RELEASE"
git -C "$SOURCE" archive "$COMMIT" | tar -x -C "$RELEASE"
ln -s "$SOURCE/.env" "$RELEASE/.env"
# Turbopack cannot trace a directory symlink outside its project root during
# build. Keep a local empty placeholder, then attach live uploads at runtime.
# mkdir/rmdir fail safely if tracked files or unexpected build output exist.
mkdir "$RELEASE/uploads"
cd "$RELEASE"
[[ $(node -p 'require("./package.json").version') == "${TAG#v}" ]] || { echo 'Tag/version mismatch.' >&2; exit 1; }
npm ci
npm run prisma:generate
CUBETTO_BUILD_SHA="$COMMIT" npm run build
rmdir "$RELEASE/uploads"
ln -s "$SOURCE/uploads" "$RELEASE/uploads"
# Spawn pg_dump with libpq variables: DATABASE_URL and its password never appear
# in process arguments, console output, or the archive of source code.
BACKUP_FILE="$BACKUP/database.dump" node --input-type=module <<'JS'
import "dotenv/config";
import { spawnSync } from "node:child_process";
const url = new URL(process.env.DATABASE_URL);
const env = { ...process.env, PGHOST: url.hostname, PGPORT: url.port || "5432",
  PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password),
  PGDATABASE: decodeURIComponent(url.pathname.slice(1)) };
const sslmode = url.searchParams.get("sslmode");
if (sslmode) env.PGSSLMODE = sslmode;
const result = spawnSync("pg_dump", ["--format=custom", "--file", process.env.BACKUP_FILE], { env, stdio: "inherit" });
if (result.status !== 0) process.exit(result.status || 1);
JS
pg_restore --list "$BACKUP/database.dump" > "$BACKUP/database-index.txt"
# Restore the backup completely in a newly created, disposable local database.
# This generated name is never read from production configuration.
VERIFY_DB="cubetto_restore_$(date -u +%Y%m%d%H%M%S)_$$"
runuser -u postgres -- createdb "$VERIFY_DB"
if ! runuser -u postgres -- pg_restore --exit-on-error --no-owner --no-privileges --dbname="$VERIFY_DB" < "$BACKUP/database.dump"; then
  runuser -u postgres -- dropdb "$VERIFY_DB"
  echo 'Backup restore verification failed; production migrations were not applied.' >&2
  exit 1
fi
runuser -u postgres -- dropdb "$VERIFY_DB"
printf 'Full restore verified in disposable database %s\n' "$VERIFY_DB" > "$BACKUP/restore-verification.txt"
tar -czf "$BACKUP/uploads.tar.gz" -C "$SOURCE" uploads
cp -p "$SOURCE/.env" "$BACKUP/production.env"
systemctl cat "$SERVICE" > "$BACKUP/service-before.txt"
systemctl show "$SERVICE" -p WorkingDirectory --value > "$BACKUP/working-directory-before.txt"
if [[ -f "$OVERRIDE" ]]; then cp -p "$OVERRIDE" "$BACKUP/override-before.conf"; fi
printf '%s\n' "$COMMIT" > "$BACKUP/commit.txt"
# Failure after switching restores the previous service directory. Schema/data
# restoration is deliberately manual: never overwrite writes made after backup.
SWITCHED=0
rollback_service() {
  result=$?
  trap - ERR
  if [[ "$SWITCHED" == 1 ]]; then
    if [[ -f "$BACKUP/override-before.conf" ]]; then cp "$BACKUP/override-before.conf" "$OVERRIDE"; else rm -f "$OVERRIDE"; fi
    systemctl daemon-reload
    systemctl restart "$SERVICE" || true
    echo "Service restored to previous directory. Review database compatibility; backup: $BACKUP" >&2
  fi
  exit "$result"
}
trap rollback_service ERR
# No reset, no seed. Migration failures stop before the service switch.
npx prisma migrate deploy
chmod -R u=rwX,go=rX "$RELEASE"
USER_NAME=$(systemctl show "$SERVICE" -p User --value)
if [[ -n "$USER_NAME" && "$USER_NAME" != root ]]; then chown -R "$USER_NAME" "$RELEASE"; fi
mkdir -p "$(dirname "$OVERRIDE")"
SWITCHED=1
printf '[Service]\nWorkingDirectory=%s\nEnvironment=CUBETTO_BUILD_SHA=%s\n' "$RELEASE" "$COMMIT" > "$OVERRIDE"
systemctl daemon-reload
systemctl restart "$SERVICE"
HEALTH_URL=${CUBETTO_HEALTH_URL:-http://127.0.0.1:3000/api/version}
HEALTHY=0
for attempt in $(seq 1 30); do
  if RESPONSE=$(curl --fail --silent --max-time 3 "$HEALTH_URL"); then
    if printf '%s' "$RESPONSE" | EXPECTED_VERSION="${TAG#v}" EXPECTED_COMMIT="$COMMIT" node --input-type=module -e 'let s="";for await(const c of process.stdin)s+=c;try{if(JSON.parse(s).version!==process.env.EXPECTED_VERSION||JSON.parse(s).commit!==process.env.EXPECTED_COMMIT)process.exit(1)}catch{process.exit(1)}'; then HEALTHY=1; break; fi
  fi
  sleep 2
done
[[ "$HEALTHY" == 1 ]]
systemctl is-active --quiet "$SERVICE"
printf 'Deployed %s (%s). Backup: %s\n' "$TAG" "$COMMIT" "$BACKUP"
