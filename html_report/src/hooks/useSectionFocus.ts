import { useEffect, type RefObject } from "react";

export function useSectionFocus(refs: RefObject<HTMLElement | null>[]) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key !== "Tab") return;

      // Skip when a dialog/modal is open
      if (document.querySelector('[role="dialog"]') || document.querySelector('.fixed')) return;

      e.preventDefault();

      const active = document.activeElement;
      const direction = e.shiftKey ? -1 : 1;

      // Find which section currently has focus (or contains the active element)
      let currentIndex = -1;
      for (let i = 0; i < refs.length; i++) {
        const el = refs[i].current;
        if (el && (el === active || el.contains(active))) {
          currentIndex = i;
          break;
        }
      }

      // Move to next/previous, wrapping around
      let nextIndex: number;
      if (currentIndex === -1) {
        nextIndex = direction === 1 ? 0 : refs.length - 1;
      } else {
        nextIndex = (currentIndex + direction + refs.length) % refs.length;
      }

      refs[nextIndex].current?.focus();
    }

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [refs]);
}
