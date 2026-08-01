"use client";
import { useState } from "react";
import { usePaginatedQuery } from "@/hooks/use-paginated-query";
import { useCrudMutations } from "@/hooks/use-crud-mutations";
import { ApiError } from "@/lib/api-client";
import { ListPage } from "@/components/shared/list-page";
import { FormDialog } from "@/components/shared/form-dialog";
import { MediaPicker } from "@/components/shared/media-picker";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Brand { id: string; name: string; slug: string; status: string; logoId: string | null }

export default function BrandsPage() {
  const [page, setPage] = useState(1); const [search, setSearch] = useState("");
  const { data, isLoading, isError, error } = usePaginatedQuery < Brand > ("brands", "/brands", { page, limit: 20, search });
  const { create, update, remove } = useCrudMutations("brands", "/brands");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState < Brand | null > (null);
  const [form, setForm] = useState({ name: "", slug: "", description: "", logoId: "", status: "active" as "active" | "inactive" });

  function openCreate() { setEditing(null); setForm({ name: "", slug: "", description: "", logoId: "", status: "active" }); setDialogOpen(true); }
  function openEdit(b: Brand) { setEditing(b); setForm({ name: b.name, slug: b.slug, description: "", logoId: b.logoId ?? "", status: b.status as any }); setDialogOpen(true); }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body: Record<string, unknown> = { ...form };
    if (!form.logoId) delete body.logoId;
    try { if (editing) await update.mutateAsync({ id: editing.id, body }); else await create.mutateAsync(body); setDialogOpen(false); }
    catch { /* toast shown */ }
  }

  return (
    <>
      <ListPage
        title="Brands" isLoading={isLoading} isError={isError} errorMessage={error instanceof ApiError ? error.message : undefined}
        data={data?.data} meta={data?.meta} onSearch={(v) => { setSearch(v); setPage(1); }} onPageChange={setPage}
        columns={["Name", "Status", ""]}
        actions={<PermissionGate permission="brand:create"><Button onClick={openCreate}>New brand</Button></PermissionGate>}
        renderRow={(b) => (
          <tr key={b.id} className="border-t">
            <td className="p-3 font-medium">{b.name}</td>
            <td className="p-3"><Badge variant={b.status === "active" ? "default" : "secondary"}>{b.status}</Badge></td>
            <td className="p-3 text-right space-x-2">
              <PermissionGate permission="brand:update"><Button variant="outline" size="sm" onClick={() => openEdit(b)}>Edit</Button></PermissionGate>
              <PermissionGate permission="brand:delete"><Button variant="destructive" size="sm" onClick={() => { if (confirm(`Delete "${b.name}"?`)) remove.mutate(b.id); }}>Delete</Button></PermissionGate>
            </td>
          </tr>
        )}
      />
      <FormDialog title={editing ? "Edit brand" : "New brand"} open={dialogOpen} onOpenChange={setDialogOpen}>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="space-y-1"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required /></div>
          </div>
          <div className="space-y-1"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="flex items-center gap-3"><MediaPicker value={form.logoId} onChange={(id) => setForm({ ...form, logoId: id })} />{form.logoId && <span className="text-xs text-muted-foreground">Logo selected</span>}</div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit">{editing ? "Save" : "Create"}</Button></div>
        </form>
      </FormDialog>
    </>
  );
}
