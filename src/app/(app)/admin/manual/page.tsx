import Link from "next/link";
import { requireHrOrMd } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createDocumentAction } from "./actions";
import { DocumentActions } from "./document-actions";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import type { ManualDocStatus, ManualDocType } from "@/lib/types";

const STATUS_TONE: Record<ManualDocStatus, "neutral" | "success" | "warning"> = {
  draft: "neutral",
  active: "success",
  archived: "warning",
};

export default async function AdminManualPage() {
  await requireHrOrMd();
  const supabase = await createClient();

  const { data: documents } = await supabase
    .from("hrm_manual_documents")
    .select("id, doc_type, title, version, status, effective_date")
    .order("doc_type")
    .order("version", { ascending: false })
    .returns<
      {
        id: string;
        doc_type: ManualDocType;
        title: string;
        version: string;
        status: ManualDocStatus;
        effective_date: string | null;
      }[]
    >();

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-semibold dark:text-slate-100">Manual & Handbook</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Author your company&apos;s own Operation Manual and Staff Handbook. Staff only ever see
        the version marked &quot;active&quot;.
      </p>

      <Card className="mb-6">
        <CardTitle>Create a document</CardTitle>
        <ActionForm action={createDocumentAction} className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="doc_type">Type</Label>
              <Select id="doc_type" name="doc_type" required>
                <option value="">Select...</option>
                <option value="operation_manual">Operation Manual</option>
                <option value="staff_handbook">Staff Handbook</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="version">Version</Label>
              <Input id="version" name="version" required placeholder="e.g. 1.0" />
            </div>
          </div>
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required placeholder="e.g. Acme Operation Manual" />
          </div>
          <div>
            <Label htmlFor="effective_date">Effective date (optional)</Label>
            <Input id="effective_date" name="effective_date" type="date" />
          </div>
          <SubmitButton pendingText="Creating...">Create document</SubmitButton>
        </ActionForm>
      </Card>

      <div className="space-y-3">
        {(documents ?? []).map((d) => (
          <Card key={d.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link href={`/admin/manual/${d.id}`} className="hover:underline">
                  <CardTitle>{d.title}</CardTitle>
                </Link>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {d.doc_type === "operation_manual" ? "Operation Manual" : "Staff Handbook"} · Version{" "}
                  {d.version}
                </p>
              </div>
              <Badge tone={STATUS_TONE[d.status]}>{d.status}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <Link href={`/admin/manual/${d.id}`} className="text-sm text-slate-500 hover:underline dark:text-slate-400">
                Manage sections →
              </Link>
              <DocumentActions documentId={d.id} status={d.status} />
            </div>
          </Card>
        ))}
        {documents?.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No documents yet — create one above to get started.
          </p>
        )}
      </div>
    </div>
  );
}
