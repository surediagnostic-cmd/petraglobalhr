import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ManualPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: documents }, { data: acknowledgements }] = await Promise.all([
    supabase
      .from("hrm_manual_documents")
      .select("id, doc_type, title, version, status")
      .order("doc_type"),
    supabase
      .from("hrm_manual_acknowledgements")
      .select("document_id, version")
      .eq("profile_id", profile.id),
  ]);

  const ackByDoc = new Map((acknowledgements ?? []).map((a) => [a.document_id, a.version]));

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-xl font-semibold">Manual & Handbook</h1>
      <p className="mb-6 text-sm text-slate-500">
        Sections shown are scoped to your department and designation. HR Manager and MD see
        everything.
      </p>
      <div className="space-y-3">
        {(documents ?? []).map((doc) => {
          const acknowledgedVersion = ackByDoc.get(doc.id);
          const isAcknowledged = acknowledgedVersion === doc.version;
          return (
            <Link key={doc.id} href={`/manual/${doc.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>{doc.title}</CardTitle>
                    <p className="text-xs text-slate-500">Version {doc.version}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={doc.status === "active" ? "success" : "neutral"}>{doc.status}</Badge>
                    <Badge tone={isAcknowledged ? "success" : "warning"}>
                      {isAcknowledged ? "Acknowledged" : "Needs acknowledgement"}
                    </Badge>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
        {documents?.length === 0 && (
          <p className="text-sm text-slate-500">No manual documents published yet.</p>
        )}
      </div>
    </div>
  );
}
