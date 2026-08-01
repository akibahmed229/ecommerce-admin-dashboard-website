"use client";
import { useState } from "react";
import { usePaginatedQuery } from "@/hooks/use-paginated-query";
import { useCrudMutations } from "@/hooks/use-crud-mutations";
import { ApiError } from "@/lib/api-client";
import { ListPage } from "@/components/shared/list-page";
import { FormDialog } from "@/components/shared/form-dialog";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

const STANDARD_ACTIONS = ["create", "read", "update", "delete", "watch", "upload", "write", "approve", "status"];
interface GroupRow { id: string; name: string; actions: { id: string; name: string }[] }

export default function PermissionsPage() {
  const [page, setPage] = useState(1); const [search, setSearch] = useState("");
  const { data, isLoading, isError, error } = usePaginatedQuery < GroupRow > ("permission-groups", "/permissions/groups", { page, limit: 20, search });
  const { create, remove } = useCrudMutations("permission-groups", "/permissions/groups");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState(""); const [description, setDescription] = useState("");
  const [checked, setChecked] = useState < Set < string >> (new Set());
  const [customAction, setCustomAction] = useState("");

  function toggle(a: string) { const n = new Set(checked); n.has(a) ? n.delete(a) : n.add(a); setChecked(n); }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const actions = [...checked, ...(customAction.trim() ? [customAction.trim()] : [])].map((name) => ({ name }));
    try {
      await create.mutateAsync({ name, description, actions });
      setDialogOpen(false); setName(""); setDescription(""); setChecked(new Set()); setCustomAction("");
    } catch { /* toast shown */ }
  }

  return (
    <>
      <ListPage
        title="Permissions" isLoading={isLoading} isError={isError} errorMessage={error instanceof ApiError ? error.message : undefined}
        data={data?.data} meta={data?.meta} onSearch={(v) => { setSearch(v); setPage(1); }} onPageChange={setPage}
        columns={["Module", "Actions", ""]}
        actions={<PermissionGate permission="permission:create"><Button onClick={() => setDialogOpen(true)}>New group</Button></PermissionGate>}
        renderRow={(g) => (
          <tr key={g.id} className="border-t">
            <td className="p-3 font-medium">{g.name}</td>
            <td className="p-3 space-x-1">{g.actions.map((a) => <Badge key={a.id} variant="secondary">{a.name.split(":")[1]}</Badge>)}</td>
            <td className="p-3 text-right"><PermissionGate permission="permission:delete"><Button variant="destructive" size="sm" onClick={() => { if (confirm(`Delete "${g.name}" and all its permissions?`)) remove.mutate(g.id); }}>Delete</Button></PermissionGate></td>
          </tr>
        )}
      />
      <FormDialog title="New permission group" open={dialogOpen} onOpenChange={setDialogOpen}>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1"><Label>Group name (module)</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div className="space-y-1"><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="space-y-2">
            <Label>Actions</Label>
            <div className="grid grid-cols-3 gap-2">{STANDARD_ACTIONS.map((a) => <label key={a} className="flex items-center gap-2 text-sm capitalize"><Checkbox checked={checked.has(a)} onCheckedChange={() => toggle(a)} />{a}</label>)}</div>
            <Input placeholder="Custom action name (optional)" value={customAction} onChange={(e) => setCustomAction(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit">Create</Button></div>
        </form>
      </FormDialog>
    </>
  );
}
