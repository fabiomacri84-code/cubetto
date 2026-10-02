"use client";

import { useEffect } from "react";

export function SWAutoUpdate() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let refreshing = false;

    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "VERSION_CHECK") {
        const swVersion = event.data.version;
        const currentVersion = document.querySelector(".sr-only")?.textContent?.replace("Cubetto v", "") ?? "";

        if (swVersion && currentVersion && swVersion !== currentVersion && !refreshing) {
          refreshing = true;
          navigator.serviceWorker.controller?.postMessage("skipWaiting");
          setTimeout(() => window.location.reload(), 500);
        }
      }
    });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        setTimeout(() => window.location.reload(), 500);
      }
    });

    navigator.serviceWorker.ready.then((reg) => {
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              newWorker.postMessage("skipWaiting");
            }
          });
        }
      });
    });
  }, []);

  return null;
}