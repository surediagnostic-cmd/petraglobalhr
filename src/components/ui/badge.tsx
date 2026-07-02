import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "success" | "warning" | "danger";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  danger: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
