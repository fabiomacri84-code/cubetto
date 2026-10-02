"use client";

import { useEffect } from "react";
import { APP_VERSION } from "../version";

export function SWAutoUpdate() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    let disposed = false;
    let checking = false;
    let reloading = false;
    const controller = new AbortController();

    async function checkVersion() {
      if (checking || reloading || document.visibilityState !== "visible") return;
      checking = true;
      try {
        const response = await fetch("/api/version", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data: { version?: string } = await response.json();
        if (disposed || !data.version || data.version === APP_VERSION) return;
        // Wait while the user is editing: never discard an unsaved form.
        if (document.querySelector('[role="dialog"], dialog[open]')) return;
        const focused = document.activeElement;
        if (focused instanceof HTMLElement &&
          (focused.matches("input, textarea, select") || focused.isContentEditable)) return;
        // At most one reload per target version, even if a proxy serves old HTML.
        const key = `cubetto:updated:${data.version}`;
        try {
          if (sessionStorage.getItem(key)) return;
          sessionStorage.setItem(key, "1");
        } catch {
          // Without persistent session state, avoid risking a reload loop.
          return;
        }
        reloading = true;
        window.location.reload();
      } catch {
        // Offline and transient failures are retried at the next check.
      } finally {
        checking = false;
      }
    }

    const timer = window.setInterval(checkVersion, 60_000);
    document.addEventListener("visibilitychange", checkVersion);
    window.addEventListener("focus", checkVersion);
    void checkVersion();
    return () => {
      disposed = true;
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", checkVersion);
      window.removeEventListener("focus", checkVersion);
    };
  }, []);

  return null;
}
