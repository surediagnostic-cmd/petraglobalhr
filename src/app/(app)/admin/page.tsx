import Link from "next/link";
import { requireHrOrMd } from "@/lib/auth/session";
import { Card, CardTitle } from "@/components/ui/card";

const sections = [
  { href: "/admin/analytics", title: "Analytics", description: "Staff, goals, training & acknowledgement numbers" },
  { href: "/admin/manual", title: "Manual & Handbook", description: "Author your Operation Manual and Staff Handbook" },
  { href: "/admin/appraisals", title: "Appraisals", description: "Run quarterly/annual staff appraisals" },
  { href: "/admin/departments", title: "Departments", description: "Manage company departments/units" },
  { href: "/admin/designations", title: "Designations", description: "Job titles, career tracks & grades" },
  { href: "/admin/staff", title: "Staff", description: "View and manage staff profiles" },
  { href: "/admin/invites", title: "Invites", description: "Invite new staff by email" },
];

export default async function AdminPage() {
  await requireHrOrMd();

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold dark:text-slate-100">Admin</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sections.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardTitle>{s.title}</CardTitle>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{s.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
