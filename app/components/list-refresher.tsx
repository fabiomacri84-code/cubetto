"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const POLL_INTERVAL_MS = 4000;

export function ListRefresher({ listId }: { listId: string }) {
  const router = useRouter();
  const snapshot = useRef<{ updatedAt: string; members: number } | null>(null);

  useEffect(() => {
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
        };

        if (
          snapshot.current !== null &&
          (data.updatedAt !== snapshot.current.updatedAt ||
            data.members !== snapshot.current.members)
        ) {
          router.refresh();
        }

        snapshot.current = { updatedAt: data.updatedAt, members: data.members };
      } catch {
        // rete assente: si riprova al prossimo giro
      }
    };

    void poll();
    const interval = setInterval(() => void poll(), POLL_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [listId, router]);

  return null;
}
