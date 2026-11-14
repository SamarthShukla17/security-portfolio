"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

function subscribe(cb: () => void) {
  const o = new MutationObserver(cb);
  o.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => o.disconnect();
}
const read = (): Theme =>
  document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, read, () => "light" as Theme);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // private mode / blocked storage: the switch still works for this visit
    }
  }

  return (
    <button
      type="button"
      id="theme-toggle"
      className="theme-toggle"
      onClick={toggle}
      aria-label="Toggle theme"
    >
      {`[ ${theme} ]`}
    </button>
  );
}
