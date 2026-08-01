"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/api-client";
import { useCrudMutations } from "@/hooks/use-crud-mutations";
import { FormDialog } from "@/components/shared/form-dialog";
import { MediaPicker } from "@/components/shared/media-picker";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CategoryNode { id: string; name: string; slug: string; parentId: string | null; isActive: boolean; sortOrder: number; imageId: string | null; children: CategoryNode[] }

function flatten(nodes: CategoryNode[], acc: CategoryNode[] = []): CategoryNode[] { nodes.forEach((n) => { acc.push(n); flatten(n.children, acc); }); return acc; }

function TreeRow({ node, depth, onEdit, onDelete }: { node: CategoryNode; depth: number; onEdit: (n: CategoryNode) => void; onDelete: (n: CategoryNode) => void }) {
  return (
    <>
      <div className="flex items-center justify-between border-t py-2" style={{ paddingLeft: depth * 20 }}>
        <span className={node.isActive ? "" : "text-muted-foreground line-through"}>{node.name}</span>
        <div className="space-x-2">
          <PermissionGate permission="category:update"><Button variant="outline" size="sm" onClick={() => onEdit(node)}>Edit</Button></PermissionGate>
          <PermissionGate permission="category:delete"><Button variant="destructive" size="sm" onClick={() => onDelete(node)}>Delete</Button></PermissionGate>
        </div>
      </div>
      {node.children.map((c) => <TreeRow key={c.id} node={c} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} />)}
    </>
  );
}

export default function CategoriesPage() {
  const { data: tree, isLoading, isError, error } = useQuery({ queryKey: ["category-tree"], queryFn: () => apiFetch < CategoryNode[] > ("/categories/tree") });
  const { create, update, remove } = useCrudMutations("category-tree", "/categories");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState < CategoryNode | null > (null);
  const [form, setForm] = useState({ name: "", slug: "", description: "", parentId: "", imageId: "", isActive: true, sortOrder: 0 });
  const allNodes = tree ? flatten(tree) : [];

  function openCreate() { setEditing(null); setForm({ name: "", slug: "", description: "", parentId: "", imageId: "", isActive: true, sortOrder: 0 }); setDialogOpen(true); }
  function openEdit(n: CategoryNode) { setEditing(n); setForm({ name: n.name, slug: n.slug, description: "", parentId: n.parentId ?? "", imageId: n.imageId ?? "", isActive: n.isActive, sortOrder: n.sortOrder }); setDialogOpen(true); }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body: Record<string, unknown> = { ...form };
    if (!form.parentId) delete body.parentId;
    if (!form.imageId) delete body.imageId;
    try { if (editing) await update.mutateAsync({ id: editing.id, body }); else await create.mutateAsync(body); setDialogOpen(false); }
    catch { /* the cycle-rejection 422 lands here — this is where you'd see it */ }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium">Categories</h1>
        <PermissionGate permission="category:create"><Button onClick={openCreate}>New category</Button></PermissionGate>
      </div>
      {isLoading && <p className="mt-4 text-muted-foreground">Loading…</p>}
      {isError && <p className="mt-4 text-red-600">{error instanceof ApiError ? error.message : "Failed to load"}</p>}
      {!isLoading && !isError && tree?.length === 0 && <p className="mt-4 text-muted-foreground">No categories yet.</p>}
      <div className="mt-4 rounded-md border">{tree?.map((n) => <TreeRow key={n.id} node={n} depth={0} onEdit={openEdit} onDelete={(n) => { if (confirm(`Delete "${n.name}"?`)) remove.mutate(n.id); }} />)}</div>

      <FormDialog title={editing ? "Edit category" : "New category"} open={dialogOpen} onOpenChange={setDialogOpen}>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="space-y-1"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required /></div>
          </div>
          <div className="space-y-1">
            <Label>Parent category</Label>
            <Select value={form.parentId || "none"} onValueChange={(v) => setForm({ ...form, parentId: v as string === "none" ? "" : v as string })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="none">None (top level)</SelectItem>{allNodes.filter((n) => n.id !== editing?.id).map((n) => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3"><MediaPicker value={form.imageId} onChange={(id) => setForm({ ...form, imageId: id })} />{form.imageId && <span className="text-xs text-muted-foreground">Image selected</span>}</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><Label>Sort order</Label><Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} /></div>
            <div className="flex items-end justify-between"><Label>Active</Label><Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} /></div>
          </div>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit">{editing ? "Save" : "Create"}</Button></div>
        </form>
      </FormDialog>
    </>
  );
}
