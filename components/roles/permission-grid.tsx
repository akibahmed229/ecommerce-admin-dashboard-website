"use client";
import { Checkbox } from "@/components/ui/checkbox";

const ACTION_ORDER = ["watch", "create", "read", "update", "delete", "upload", "write", "approve", "status"];
interface Group { id: string; name: string; actions: { id: string; name: string }[] }

export function PermissionGrid({ groups, selected, onChange }: { groups: Group[]; selected: Set<string>; onChange: (s: Set<string>) => void }) {
  function toggle(id: string) { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); onChange(n); }
  function toggleRow(group: Group) {
    const ids = group.actions.map((a) => a.id);
    const allOn = ids.every((id) => selected.has(id));
    const n = new Set(selected);
    ids.forEach((id) => (allOn ? n.delete(id) : n.add(id)));
    onChange(n);
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50"><tr><th className="p-2 text-left">Module</th>{ACTION_ORDER.map((a) => <th key={a} className="p-2 text-center capitalize">{a}</th>)}</tr></thead>
        <tbody>
          {groups.map((group) => {
            const byAction = new Map(group.actions.map((a) => [a.name.split(":")[1], a]));
            return (
              <tr key={group.id} className="border-t">
                <td className="p-2 font-medium"><button type="button" className="hover:underline" onClick={() => toggleRow(group)}>{group.name}</button></td>
                {ACTION_ORDER.map((action) => {
                  const p = byAction.get(action);
                  return <td key={action} className="p-2 text-center">{p && <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggle(p.id)} />}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
