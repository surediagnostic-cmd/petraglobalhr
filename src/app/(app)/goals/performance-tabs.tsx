"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function PerformanceTabs({ showReview }: { showReview: boolean }) {
  const pathname = usePathname();

  const tabs = [
    { href: "/goals", label: "Goals" },
    { href: "/goals/reports", label: "Reports" },
    ...(showReview ? [{ href: "/goals/review", label: "Review queue" }] : []),
    { href: "/goals/appraisals", label: "Appraisals" },
  ];

  return (
    <div className="mb-6 flex gap-1 border-b border-slate-200 dark:border-slate-800">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-3 py-2 text-sm font-medium border-b-2 -mb-px",
              active
                ? "border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
