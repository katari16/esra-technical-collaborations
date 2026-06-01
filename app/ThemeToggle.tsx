"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const t = (document.documentElement.getAttribute("data-theme") as "dark" | "light") || "dark";
    setTheme(t);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("esra-theme", next); } catch {}
  }

  return (
    <button className="theme-toggle" onClick={toggle} aria-label="Toggle colour theme">
      {theme === "dark" ? "☀ Light" : "☾ Dark"}
    </button>
  );
}
