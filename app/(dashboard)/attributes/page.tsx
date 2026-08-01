"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/api-client";
import { useCrudMutations } from "@/hooks/use-crud-mutations";
import { FormDialog } from "@/components/shared/form-dialog";
import { MediaPicker } from "@/components/shared/media-picker";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface AttrValue { id: string; value: string; slug: string; hexCode: string | null; mediaId: string | null }
interface Attribute { id: string; name: string; slug: string; type: string; values: AttrValue[] }
const TYPES = ["dropdown", "radio", "checkbox", "colour_swatch", "image_swatch"];

export default function AttributesPage() {
  const { data: attributes, isLoading, isError, error } = useQuery({ queryKey: ["attributes"], queryFn: () => apiFetch < Attribute[] > ("/attributes") });
  const { create, update, remove } = useCrudMutations("attributes", "/attributes");
  const qc = useQueryClient();

  const [attrDialogOpen, setAttrDialogOpen] = useState(false);
  const [editingAttr, setEditingAttr] = useState < Attribute | null > (null);
  const [attrForm, setAttrForm] = useState({ name: "", slug: "", type: "dropdown" });
  const [valuesFor, setValuesFor] = useState < Attribute | null > (null);
  const [valueForm, setValueForm] = useState({ value: "", slug: "", hexCode: "", mediaId: "" });

  function openCreateAttr() { setEditingAttr(null); setAttrForm({ name: "", slug: "", type: "dropdown" }); setAttrDialogOpen(true); }
  function openEditAttr(a: Attribute) { setEditingAttr(a); setAttrForm({ name: a.name, slug: a.slug, type: a.type }); setAttrDialogOpen(true); }

  async function onSubmitAttr(e: React.FormEvent) {
    e.preventDefault();
    try { if (editingAttr) await update.mutateAsync({ id: editingAttr.id, body: attrForm }); else await create.mutateAsync(attrForm); setAttrDialogOpen(false); }
    catch { /* toast shown */ }
  }

  async function onAddValue(e: React.FormEvent) {
    e.preventDefault();
    if (!valuesFor) return;
    const body: Record<string, unknown> = { value: valueForm.value, slug: valueForm.slug };
    if (valuesFor.type === "colour_swatch" && valueForm.hexCode) body.hexCode = valueForm.hexCode;
    if (valuesFor.type === "image_swatch" && valueForm.mediaId) body.mediaId = valueForm.mediaId;
    try {
      await apiFetch(`/attributes/${valuesFor.id}/values`, { method: "POST", body: JSON.stringify(body) });
      qc.invalidateQueries({ queryKey: ["attributes"] });
      setValueForm({ value: "", slug: "", hexCode: "", mediaId: "" });
    } catch (err) { alert(err instanceof ApiError ? err.message : "Failed to add value"); }
  }

  async function onDeleteValue(attributeId: string, valueId: string) {
    if (!confirm("Delete this value?")) return;
    try { await apiFetch(`/attributes/${attributeId}/values/${valueId}`, { method: "DELETE" }); qc.invalidateQueries({ queryKey: ["attributes"] }); }
    catch (err) { alert(err instanceof ApiError ? err.message : "Failed to delete — likely still used by a variant"); }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium">Attributes</h1>
        <PermissionGate permission="attribute:create"><Button onClick={openCreateAttr}>New attribute</Button></PermissionGate>
      </div>
      {isLoading && <p className="mt-4 text-muted-foreground">Loading…</p>}
      {isError && <p className="mt-4 text-red-600">{error instanceof ApiError ? error.message : "Failed to load"}</p>}
      {!isLoading && !isError && attributes?.length === 0 && <p className="mt-4 text-muted-foreground">No attributes yet.</p>}
      <div className="mt-4 space-y-2">
        {attributes?.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded border p-3">
            <div><span className="font-medium">{a.name}</span> <Badge variant="secondary">{a.type.replace("_", " ")}</Badge> <span className="text-sm text-muted-foreground">{a.values.length} value(s)</span></div>
            <div className="space-x-2">
              <Button variant="outline" size="sm" onClick={() => setValuesFor(a)}>Manage values</Button>
              <PermissionGate permission="attribute:update"><Button variant="outline" size="sm" onClick={() => openEditAttr(a)}>Edit</Button></PermissionGate>
              <PermissionGate permission="attribute:delete"><Button variant="destructive" size="sm" onClick={() => { if (confirm(`Delete "${a.name}"?`)) remove.mutate(a.id); }}>Delete</Button></PermissionGate>
            </div>
          </div>
        ))}
      </div>

      <FormDialog title={editingAttr ? "Edit attribute" : "New attribute"} open={attrDialogOpen} onOpenChange={setAttrDialogOpen}>
        <form onSubmit={onSubmitAttr} className="space-y-4">
          <div className="space-y-1"><Label>Name</Label><Input value={attrForm.name} onChange={(e) => setAttrForm({ ...attrForm, name: e.target.value })} required /></div>
          <div className="space-y-1"><Label>Slug</Label><Input value={attrForm.slug} onChange={(e) => setAttrForm({ ...attrForm, slug: e.target.value })} required /></div>
          <div className="space-y-1">
            <Label>Type</Label>
            <Select value={attrForm.type} onValueChange={(v) => setAttrForm({ ...attrForm, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setAttrDialogOpen(false)}>Cancel</Button><Button type="submit">{editingAttr ? "Save" : "Create"}</Button></div>
        </form>
      </FormDialog>

      <FormDialog title={`Values for ${valuesFor?.name ?? ""}`} open={!!valuesFor} onOpenChange={(v) => !v && setValuesFor(null)}>
        {valuesFor && (
          <div className="space-y-4">
            <div className="space-y-2">
              {valuesFor.values.map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded border p-2 text-sm">
                  <span className="flex items-center gap-2">{v.hexCode && <span className="h-4 w-4 rounded-full border" style={{ backgroundColor: v.hexCode }} />}{v.value}</span>
                  <Button variant="destructive" size="sm" onClick={() => onDeleteValue(valuesFor.id, v.id)}>Delete</Button>
                </div>
              ))}
              {valuesFor.values.length === 0 && <p className="text-sm text-muted-foreground">No values yet.</p>}
            </div>
            <form onSubmit={onAddValue} className="space-y-2 border-t pt-3">
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Value (e.g. Red)" value={valueForm.value} onChange={(e) => setValueForm({ ...valueForm, value: e.target.value })} required />
                <Input placeholder="Slug (e.g. red)" value={valueForm.slug} onChange={(e) => setValueForm({ ...valueForm, slug: e.target.value })} required />
              </div>
              {valuesFor.type === "colour_swatch" && <Input type="color" value={valueForm.hexCode || "#000000"} onChange={(e) => setValueForm({ ...valueForm, hexCode: e.target.value })} />}
              {valuesFor.type === "image_swatch" && <MediaPicker value={valueForm.mediaId} onChange={(id) => setValueForm({ ...valueForm, mediaId: id })} />}
              <Button type="submit" size="sm">Add value</Button>
            </form>
          </div>
        )}
      </FormDialog>
    </>
  );
}
