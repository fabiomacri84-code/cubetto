"use client";

import { useEffect } from "react";

// iOS, riaprendo la PWA, ripristina il focus sull'ultimo input usato e apre
// la tastiera da solo: qui lo togliamo, salvo i campi con autofocus esplicito.
export function FocusGuard() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const onShow = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const el = document.activeElement;
        if (
          el instanceof HTMLElement &&
          (el.tagName === "INPUT" || el.tagName === "TEXTAREA") &&
          !el.hasAttribute("autofocus")
        ) {
          el.blur();
        }
      }, 300);
    };

    window.addEventListener("pageshow", onShow);
    return () => {
      window.removeEventListener("pageshow", onShow);
      clearTimeout(timer);
    };
  }, []);

  return null;
}