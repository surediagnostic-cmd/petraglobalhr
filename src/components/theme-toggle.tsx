"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  // Starts null (render nothing) until mounted, since the real theme was
  // already applied pre-paint by the inline script in layout.tsx — reading
  // it here on mount just syncs this button's icon, it doesn't set the theme.
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    // Deliberate post-mount setState: the actual dark/light value is only
    // knowable client-side (no `document` during SSR), and the inline
    // script in the root layout already applied it before paint. Reading
    // it during render instead would mismatch the server-rendered
    // placeholder and trigger a hydration error.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  }

  if (isDark === null) return <div className="h-9 w-9" />;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {isDark ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
