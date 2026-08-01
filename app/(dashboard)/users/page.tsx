"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePaginatedQuery } from "@/hooks/use-paginated-query";
import { useCrudMutations } from "@/hooks/use-crud-mutations";
import { apiFetch, apiFetchPaginated, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { ListPage } from "@/components/shared/list-page";
import { FormDialog } from "@/components/shared/form-dialog";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface UserRow { id: string; name: string; email: string; roleId: string; role: { name: string }; isActive: boolean }
interface RoleOption { id: string; name: string }

export default function UsersPage() {
  const { user: me } = useAuth();
  const [page, setPage] = useState(1); const [search, setSearch] = useState("");
  const { data, isLoading, isError, error } = usePaginatedQuery < UserRow > ("users", "/users", { page, limit: 20, search });
  const { data: roleOptions } = useQuery({ queryKey: ["roles-all"], queryFn: () => apiFetchPaginated < RoleOption > ("/roles?limit=100").then((r) => r.data) });
  const { create, update, remove } = useCrudMutations("users", "/users");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState < UserRow | null > (null);
  const [form, setForm] = useState({ name: "", email: "", password: "", roleId: "", isActive: true });

  function openCreate() { setEditing(null); setForm({ name: "", email: "", password: "", roleId: "", isActive: true }); setDialogOpen(true); }
  function openEdit(u: UserRow) { setEditing(u); setForm({ name: u.name, email: u.email, password: "", roleId: u.roleId, isActive: u.isActive }); setDialogOpen(true); }

  const isSelf = editing?.id === me?.id;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editing) {
        // Backend rejects ANY roleId in the payload for a self-edit, even if unchanged —
        // it must not be present in the body at all when editing your own account.
        const body: Record<string, unknown> = { name: form.name, email: form.email };
        if (form.password) body.password = form.password;
        if (!isSelf) body.roleId = form.roleId;
        await update.mutateAsync({ id: editing.id, body });
        if (form.isActive !== editing.isActive) {
          await apiFetch(`/users/${editing.id}/status`, { method: "PATCH", body: JSON.stringify({ isActive: form.isActive }) });
        }
      } else {
        await create.mutateAsync(form);
      }
      setDialogOpen(false);
    } catch { /* toast shown */ }
  }

  return (
    <>
      <ListPage
        title="Users" isLoading={isLoading} isError={isError} errorMessage={error instanceof ApiError ? error.message : undefined}
        data={data?.data} meta={data?.meta} onSearch={(v) => { setSearch(v); setPage(1); }} onPageChange={setPage}
        columns={["Name", "Email", "Role", "Status", ""]}
        actions={<PermissionGate permission="user:create"><Button onClick={openCreate}>New user</Button></PermissionGate>}
        renderRow={(u) => (
          <tr key={u.id} className="border-t">
            <td className="p-3 font-medium">{u.name}</td>
            <td className="p-3">{u.email}</td>
            <td className="p-3">{u.role?.name}</td>
            <td className="p-3"><Badge variant={u.isActive ? "default" : "secondary"}>{u.isActive ? "active" : "inactive"}</Badge></td>
            <td className="p-3 text-right space-x-2">
              <PermissionGate permission="user:update"><Button variant="outline" size="sm" onClick={() => openEdit(u)}>Edit</Button></PermissionGate>
              <PermissionGate permission="user:delete"><Button variant="destructive" size="sm" disabled={u.id === me?.id} onClick={() => { if (confirm(`Delete ${u.name}?`)) remove.mutate(u.id); }}>Delete</Button></PermissionGate>
            </td>
          </tr>
        )}
      />
      <FormDialog title={editing ? "Edit user" : "New user"} open={dialogOpen} onOpenChange={setDialogOpen}>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
          </div>
          <div className="space-y-1">
            <Label>{editing ? "New password (leave blank to keep current)" : "Password"}</Label>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} minLength={8} />
          </div>
          <div className="space-y-1">
            <Label>Role {isSelf && <span className="text-xs text-muted-foreground">(can't change your own role)</span>}</Label>
            <Select value={form.roleId} onValueChange={(v) => setForm({ ...form, roleId: v })} disabled={isSelf} required>
              <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
              <SelectContent>{roleOptions?.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {editing && <div className="flex items-center justify-between"><Label>Active</Label><Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} /></div>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending || update.isPending}>{editing ? "Save" : "Create"}</Button>
          </div>
        </form>
      </FormDialog>
    </>
  );
}
