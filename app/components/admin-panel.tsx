import { resetUserPassword, setUserRole } from "../admin-actions";
import { DeleteUserButton } from "./delete-user-button";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { CreateUserSheet } from "./create-user-sheet";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
};

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);

export function AdminPanel({
  user,
  users,
}: {
  user: { id: string };
  users: AdminUser[];
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-text">
          Utenti ({users.length})
        </h2>
        <CreateUserSheet />
      </div>

      <ul className="mt-4 divide-y divide-line">
        {users.map((u) => {
          const isSelf = u.id === user.id;

          return (
            <li key={u.id} className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-text">
                    {u.name}
                    {isSelf ? (
                      <span className="ml-2 text-xs font-normal text-text-3">
                        (tu)
                      </span>
                    ) : null}
                  </p>
                  <p className="tnum mt-0.5 text-xs text-text-3">
                    {u.email} · dal {formatDate(u.createdAt)}
                  </p>
                </div>
                <span
                  className={
                    u.role === "admin"
                      ? "rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent"
                      : "rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-text-3"
                  }
                >
                  {u.role === "admin" ? "Amministratore" : "Utente"}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-medium text-text-3">Ruolo</p>
                  <form action={setUserRole} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={u.id} />
                    <select
                      name="role"
                      defaultValue={u.role}
                      disabled={isSelf}
                      aria-label={`Ruolo di ${u.name}`}
                      className="min-h-9 flex-1 rounded-md border border-line-strong bg-subtle px-2 py-1.5 text-sm text-text outline-none focus:border-accent disabled:opacity-50"
                    >
                      <option value="user">Utente</option>
                      <option value="admin">Amministratore</option>
                    </select>
                    <Button type="submit" size="sm" disabled={isSelf}>
                      Salva
                    </Button>
                  </form>
                </div>

                {u.role !== "admin" ? (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs font-medium text-text-3">
                      Nuova password
                    </p>
                    <form
                      action={resetUserPassword}
                      className="flex items-center gap-2"
                    >
                      <input type="hidden" name="userId" value={u.id} />
                      <Input
                        name="newPassword"
                        type="password"
                        placeholder="min. 8 caratteri"
                        minLength={8}
                        required
                        aria-label={`Nuova password per ${u.name}`}
                        className="min-h-9 flex-1 px-2 py-1.5 text-sm"
                      />
                      <Button type="submit" size="sm">
                        Reimposta
                      </Button>
                    </form>
                  </div>
                ) : null}

                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-medium text-text-3">
                    Elimina account
                  </p>
                  <DeleteUserButton userId={u.id} name={u.name} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}