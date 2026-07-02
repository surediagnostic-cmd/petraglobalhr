"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { NavLink } from "@/components/nav-link";
import { Badge } from "@/components/ui/badge";
import { VisitCompanyButton } from "@/app/(app)/admin/companies/visit-company-button";

export function AppSidebar({
  companyName,
  fullName,
  roleOrDesignation,
  branchName,
  isSuperAdmin,
  isHrOrMd,
  homeCompanyId,
  homeCompanyName,
}: {
  companyName: string;
  fullName: string;
  roleOrDesignation: string;
  branchName: string | null;
  isSuperAdmin: boolean;
  isHrOrMd: boolean;
  homeCompanyId: string | null;
  homeCompanyName: string | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);

  // Close on navigation rather than wiring an onClick into every NavLink —
  // any route change means the user picked something, so the overlay's job
  // is done. Adjusting state during render (React's documented alternative
  // to an effect for "reset on prop change") instead of useEffect, since
  // that would trigger an extra render pass for no benefit here.
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setIsOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
        className="fixed left-4 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-md bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/30"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform overflow-y-auto border-r border-slate-200 bg-white p-4 pt-16 shadow-lg transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6">
          <p className="text-sm font-semibold dark:text-slate-100">{companyName}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{fullName}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {roleOrDesignation}
            {branchName ? ` · ${branchName}` : ""}
          </p>
          {isSuperAdmin && (
            <Badge tone="warning" className="mt-2">
              Super Admin
            </Badge>
          )}
        </div>
        {homeCompanyId && (
          <div className="mb-6 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs dark:border-amber-800 dark:bg-amber-950">
            <p className="mb-2 text-amber-800 dark:text-amber-300">
              Visiting as MD{homeCompanyName ? ` — home company is ${homeCompanyName}` : ""}
            </p>
            <VisitCompanyButton companyId={homeCompanyId} label="Return to my company" />
          </div>
        )}
        <nav className="space-y-1">
          <NavLink href="/manual">Manual & Handbook</NavLink>
          <NavLink href="/goals">Performance</NavLink>
          <NavLink href="/training">Training</NavLink>
          <NavLink href="/messages">Messages</NavLink>
          <NavLink href="/directory">Directory</NavLink>
          {isHrOrMd && <NavLink href="/admin">Admin</NavLink>}
          {isSuperAdmin && <NavLink href="/admin/companies">Companies</NavLink>}
        </nav>
      </aside>
    </>
  );
}
