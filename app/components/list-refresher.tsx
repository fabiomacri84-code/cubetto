"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const POLL_INTERVAL_MS = 2500;
const HEARTBEAT_INTERVAL_MS = 10_000;

type Snapshot = { updatedAt: string; members: number; present: string };

export function ListRefresher({
  listId,
  initialUpdatedAt,
  initialMembers,
  initialPresent,
}: {
  listId: string;
  initialUpdatedAt: string;
  initialMembers: number;
  initialPresent: string;
}) {
  const router = useRouter();
  const snapshot = useRef<Snapshot>({
    updatedAt: initialUpdatedAt,
    members: initialMembers,
    present: initialPresent,
  });

  useEffect(() => {
    const heartbeat = async () => {
      try {
        await fetch(`/api/lists/${listId}/presence`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
          keepalive: true,
        });
      } catch {
        // rete assente: si riprova al prossimo giro
      }
    };

    const leave = () => {
      fetch(`/api/lists/${listId}/presence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leave: true }),
        keepalive: true,
      }).catch(() => {});
    };

    void heartbeat();
    const heartbeatTimer = setInterval(() => {
      if (document.visibilityState === "visible") {
        void heartbeat();
      }
    }, HEARTBEAT_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        leave();
      } else {
        void heartbeat();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", leave);

    const poll = async () => {
      try {
        const response = await fetch(`/api/lists/${listId}/updated-at`, {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          updatedAt: string;
          members: number;
          present: string[];
        };

        const next: Snapshot = {
          updatedAt: data.updatedAt,
          members: data.members,
          present: [...data.present].sort().join(","),
        };

        if (
          next.updatedAt !== snapshot.current.updatedAt ||
          next.members !== snapshot.current.members ||
          next.present !== snapshot.current.present
        ) {
          router.refresh();
        }

        snapshot.current = next;
      } catch {
        // rete assente: si riprova al prossimo giro
      }
    };

    void poll();
    const pollTimer = setInterval(() => void poll(), POLL_INTERVAL_MS);

    return () => {
      clearInterval(heartbeatTimer);
      clearInterval(pollTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", leave);
    };
  }, [listId, router]);

  return null;
}