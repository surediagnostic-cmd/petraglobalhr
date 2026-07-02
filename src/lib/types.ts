import type { RoleTier } from "@/lib/auth/roles";

export type CareerTrack = "lab" | "radiology" | "finance" | "marketing" | "operations" | "other";
export type EmploymentStatus = "active" | "on_leave" | "suspended" | "terminated";

export interface Company {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

export interface Department {
  id: string;
  company_id: string;
  name: string;
}

export interface Branch {
  id: string;
  company_id: string;
  name: string;
  address: string | null;
}

export interface Designation {
  id: string;
  company_id: string;
  department_id: string | null;
  title: string;
  career_track: CareerTrack | null;
  career_level_data: Record<string, unknown> | null;
}

export interface Profile {
  id: string;
  company_id: string;
  branch_id: string | null;
  department_id: string | null;
  designation_id: string | null;
  role: RoleTier;
  is_super_admin: boolean;
  full_name: string;
  phone: string | null;
  employment_status: EmploymentStatus;
  date_joined: string | null;
  reports_to: string | null;
  home_company_id: string | null;
  home_role: RoleTier | null;
  home_department_id: string | null;
  home_designation_id: string | null;
}

export type ManualDocType = "operation_manual" | "staff_handbook";
export type ManualDocStatus = "draft" | "active" | "archived";

export interface ManualDocument {
  id: string;
  company_id: string;
  doc_type: ManualDocType;
  title: string;
  version: string;
  effective_date: string | null;
  status: ManualDocStatus;
}

export interface ManualSection {
  id: string;
  document_id: string;
  section_number: string;
  title: string;
  subtitle: string | null;
  body: string;
  who_is_responsible: string | null;
  escalation_chain: string | null;
  md_only: boolean;
  order_index: number;
}

export type GoalStatus = "draft" | "active" | "completed" | "missed";
export type ReviewStatus = "pending" | "approved" | "changes_requested";

export interface Goal {
  id: string;
  profile_id: string;
  company_id: string;
  kpi_definition_id: string | null;
  title: string;
  description: string | null;
  target_value: number | null;
  target_unit: string | null;
  period_start: string;
  period_end: string;
  status: GoalStatus;
}

export interface GoalReport {
  id: string;
  goal_id: string;
  profile_id: string;
  period_label: string;
  actual_value: number | null;
  narrative: string | null;
  submitted_at: string;
  reviewer_id: string | null;
  review_status: ReviewStatus;
  reviewer_comment: string | null;
}

export type TrainingStatus = "assigned" | "in_progress" | "completed";

export interface TrainingModule {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  delivery_mode: string | null;
  duration_minutes: number | null;
  department_id: string | null;
  designation_id: string | null;
  is_mandatory: boolean;
}

export interface TrainingRecord {
  id: string;
  module_id: string;
  profile_id: string;
  status: TrainingStatus;
  hours_logged: number;
  completed_at: string | null;
}

export type ConversationType = "direct" | "channel";

export interface Conversation {
  id: string;
  company_id: string;
  type: ConversationType;
  title: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}
