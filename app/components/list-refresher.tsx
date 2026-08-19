"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const POLL_INTERVAL_MS = 4000;

export function ListRefresher({ listId }: { listId: string }) {
  const router = useRouter();
  const lastUpdated = useRef<string | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/lists/${listId}/updated-at`, {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { updatedAt: string };

        if (lastUpdated.current !== null && data.updatedAt !== lastUpdated.current) {
          router.refresh();
        }

        lastUpdated.current = data.updatedAt;
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
