"use client";

import { useEffect } from "react";

export function FocusModality() {
  useEffect(() => {
    const root = document.documentElement;
    function pointer() {
      root.dataset.pointerFocus = "";
    }
    function keyboard(event: KeyboardEvent) {
      if (typeof event.key !== "string") return;
      if (event.key === "Tab" || event.key.startsWith("Arrow") || event.key === "Escape") {
        delete root.dataset.pointerFocus;
      }
    }
    document.addEventListener("pointerdown", pointer, true);
    document.addEventListener("keydown", keyboard, true);
    return () => {
      document.removeEventListener("pointerdown", pointer, true);
      document.removeEventListener("keydown", keyboard, true);
      delete root.dataset.pointerFocus;
    };
  }, []);
  return null;
}
