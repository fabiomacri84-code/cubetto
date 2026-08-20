import Link from "next/link";
import type { ReactNode } from "react";
import { logout } from "../auth-actions";
import { IconImage } from "./icon-image";
import { cn } from "./ui/cn";

type NavList = { id: string; name: string; emoji: string; color: string };
type NavPack = { id: string; name: string; emoji: string; color: string };

export function AppShell({
  user,
  lists,
  packs,
  activeListId,
  activePackId,
  children,
}: {
  user: { id: string; name: string; email: string; role: string };
  lists: NavList[];
  packs: NavPack[];
  activeListId?: string;
  activePackId?: string;
  children: ReactNode;
}) {
  return (
    <div className="shell">
      <aside className="sidebar fixed inset-y-0 left-0 z-40 hidden w-72 flex-col lg:flex">
        <div className="flex items-center gap-2 px-6 pb-4 pt-7">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-2xl text-2xl shadow-card"
            aria-hidden
          >
            🧳
          </span>
          <div>
            <p className="text-lg font-bold leading-tight text-text">Cubetto</p>
            <p className="text-xs text-text-3">Liste e pack, insieme.</p>
          </div>
        </div>

        <nav className="mt-4 flex-1 overflow-y-auto px-3 pb-6">
          <Link href="/" className="nav-item mb-2">
            <span className="text-lg" aria-hidden>
              🏠
            </span>
            Home
          </Link>

          <p className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-widest text-text-3">
            Le mie liste
          </p>
          <div className="flex flex-col gap-0.5">
            {lists.length === 0 ? (
              <p className="px-3 py-2 text-xs text-text-3">Ancora nessuna lista.</p>
            ) : (
              lists.map((list) => (
                <Link
                  key={list.id}
                  href={`/lists/${list.id}`}
                  className={cn(
                    "nav-item",
                    activeListId === list.id && "nav-item-active",
                  )}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-lg"
                    style={{ backgroundColor: `${list.color}1c` }}
                    aria-hidden
                  >
                    <IconImage emoji={list.emoji} className="h-6 w-6" />
                  </span>
                  <span className="min-w-0 truncate">{list.name}</span>
                </Link>
              ))
            )}
          </div>

          <p className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-widest text-text-3">
            I tuoi pack
          </p>
          <div className="flex flex-col gap-0.5">
            {packs.length === 0 ? (
              <p className="px-3 py-2 text-xs text-text-3">Ancora nessun pack.</p>
            ) : (
              packs.map((pack) => (
                <Link
                  key={pack.id}
                  href={`/packs/${pack.id}`}
                  className={cn(
                    "nav-item",
                    activePackId === pack.id && "nav-item-active",
                  )}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-lg"
                    style={{ backgroundColor: `${pack.color}1c` }}
                    aria-hidden
                  >
                    <IconImage emoji={pack.emoji} className="h-6 w-6" />
                  </span>
                  <span className="min-w-0 truncate">{pack.name}</span>
                </Link>
              ))
            )}
          </div>
        </nav>

        <div className="border-t border-line px-3 py-3">
          <div className="mb-2 flex items-center gap-2.5 px-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent-strong">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text">{user.name}</p>
              <p className="truncate text-xs text-text-3">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            {user.role === "admin" ? (
              <Link
                href="/admin"
                aria-label="Amministrazione"
                className="flex h-10 flex-1 items-center justify-center rounded-xl text-sm font-medium text-text-2 hover:bg-subtle"
              >
                🛡️ Admin
              </Link>
            ) : null}
            <Link
              href="/settings"
              className="flex h-10 flex-1 items-center justify-center rounded-xl text-sm font-medium text-text-2 hover:bg-subtle"
            >
              ⚙️ Impostazioni
            </Link>
            <form action={logout} className="flex-1">
              <button
                type="submit"
                className="flex h-10 w-full items-center justify-center rounded-xl text-sm font-medium text-text-2 hover:bg-subtle"
              >
                Esci
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="main-panel lg:pl-72">{children}</div>
    </div>
  );
}