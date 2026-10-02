import { APP_VERSION } from "../../version";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { version: APP_VERSION, commit: process.env.CUBETTO_BUILD_SHA ?? null },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
