"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePaginatedQuery } from "@/hooks/use-paginated-query";
import { useCrudMutations } from "@/hooks/use-crud-mutations";
import { apiFetchPaginated, ApiError } from "@/lib/api-client";
import { ListPage } from "@/components/shared/list-page";
import { FormDialog } from "@/components/shared/form-dialog";
import { PermissionGrid } from "@/components/roles/permission-grid";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface Role { id: string; name: string; description: string | null; status: string; permissions: { id: string; name: string }[]; userCount: number }
interface GroupDTO { id: string; name: string; actions: { id: string; name: string }[] }

export default function RolesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, error } = usePaginatedQuery < Role > ("roles", "/roles", { page, limit: 20, search });
  const { data: groups } = useQuery({ queryKey: ["permission-groups-all"], queryFn: () => apiFetchPaginated < GroupDTO > ("/permissions/groups?limit=100").then((r) => r.data) });
  const { create, update, remove } = useCrudMutations("roles", "/roles");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState < Role | null > (null);
  const [name, setName] = useState(""); const [description, setDescription] = useState("");
  const [status, setStatus] = useState < "active" | "inactive" > ("active");
  const [selected, setSelected] = useState < Set < string >> (new Set());
  const [grantAll, setGrantAll] = useState(false);

  function openCreate() { setEditing(null); setName(""); setDescription(""); setStatus("active"); setSelected(new Set()); setGrantAll(false); setDialogOpen(true); }
  function openEdit(role: Role) { setEditing(role); setName(role.name); setDescription(role.description ?? ""); setStatus(role.status as any); setSelected(new Set(role.permissions.map((p) => p.id))); setGrantAll(false); setDialogOpen(true); }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = { name, description, status, permissionIds: [...selected], grantAll };
    try {
      if (editing) await update.mutateAsync({ id: editing.id, body });
      else await create.mutateAsync(body);
      setDialogOpen(false);
    } catch { /* the last-admin-guard 403 and duplicate-name 409 both land here as a toast */ }
  }

  return (
    <>
      <ListPage
        title="Roles" isLoading={isLoading} isError={isError} errorMessage={error instanceof ApiError ? error.message : undefined}
        data={data?.data} meta={data?.meta} onSearch={(v) => { setSearch(v); setPage(1); }} onPageChange={setPage}
        columns={["Name", "Status", "Users", "Permissions", ""]}
        actions={<PermissionGate permission="role:create"><Button onClick={openCreate}>New role</Button></PermissionGate>}
        renderRow={(role) => (
          <tr key={role.id} className="border-t">
            <td className="p-3 font-medium">{role.name}</td>
            <td className="p-3"><Badge variant={role.status === "active" ? "default" : "secondary"}>{role.status}</Badge></td>
            <td className="p-3">{role.userCount}</td>
            <td className="p-3">{role.permissions.length}</td>
            <td className="p-3 text-right space-x-2">
              <PermissionGate permission="role:update"><Button variant="outline" size="sm" onClick={() => openEdit(role)}>Edit</Button></PermissionGate>
              <PermissionGate permission="role:delete"><Button variant="destructive" size="sm" onClick={() => { if (confirm(`Delete role "${role.name}"?`)) remove.mutate(role.id); }}>Delete</Button></PermissionGate>
            </td>
          </tr>
        )}
      />

      <FormDialog title={editing ? "Edit role" : "New role"} open={dialogOpen} onOpenChange={setDialogOpen}>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1"><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="flex items-center justify-between">
            <Label>Permissions</Label>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={grantAll} onCheckedChange={(v) => setGrantAll(!!v)} />Grant all (admin role)</label>
          </div>
          {groups && !grantAll && <PermissionGrid groups={groups} selected={selected} onChange={setSelected} />}
          {grantAll && <p className="text-sm text-muted-foreground">Every permission in the system will be granted.</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending || update.isPending}>{editing ? "Save" : "Create"}</Button>
          </div>
        </form>
      </FormDialog>
    </>
  );
}
