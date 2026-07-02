export type RoleTier = "staff" | "hr_manager" | "md";

export function isHrOrMd(role: RoleTier | null | undefined): boolean {
  return role === "hr_manager" || role === "md";
}

export function isMd(role: RoleTier | null | undefined): boolean {
  return role === "md";
}

export function roleLabel(role: RoleTier): string {
  switch (role) {
    case "hr_manager":
      return "HR Manager";
    case "md":
      return "MD";
    default:
      return "Staff";
  }
}
