"use client";

import { useRouter, usePathname } from "next/navigation";
import { Select } from "@/components/ui/select";

const ALL_BRANCHES = "all";

// Super-admin-only view filter: re-navigates to this same page with updated
// ?company=/&branch= params, which the server component reads to decide
// which company's (and optionally branch's) numbers to compute. This is
// intentionally separate from visitCompanyAction — that switches the
// caller's own profile to actually work inside another company; this only
// changes what a read-only report displays.
export function AnalyticsScopeSelect({
  companies,
  branches,
  selectedCompanyId,
  selectedBranchId,
}: {
  companies: { id: string; name: string }[];
  branches: { id: string; name: string }[];
  selectedCompanyId: string;
  selectedBranchId: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function navigate(companyId: string, branchId: string) {
    const params = new URLSearchParams();
    params.set("company", companyId);
    if (branchId !== ALL_BRANCHES) params.set("branch", branchId);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="sm:w-56">
        <Select
          aria-label="Company"
          value={selectedCompanyId}
          onChange={(e) => navigate(e.target.value, ALL_BRANCHES)}
        >
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="sm:w-56">
        <Select
          aria-label="Branch"
          value={selectedBranchId ?? ALL_BRANCHES}
          onChange={(e) => navigate(selectedCompanyId, e.target.value)}
        >
          <option value={ALL_BRANCHES}>All Branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
