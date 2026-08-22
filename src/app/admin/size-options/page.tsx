import { listSizeOptions } from "@/lib/queries";
import { SizeGroupsManager } from "@/components/admin/size-groups-manager";

export const dynamic = "force-dynamic";

/** Admin size and age brackets management page for viewing and editing category options. */
export default async function SizeOptionsPage() {

  const options = await listSizeOptions();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Size / Age groups</h1>
        <p className="text-sm text-muted-foreground">
          Add or reorder brackets (e.g. a new “36-48 months” age group or size 46)
          anytime — no code changes needed. Different product lines can use
          different systems.
        </p>
      </div>
      <SizeGroupsManager options={options} />
    </div>
  );
}
