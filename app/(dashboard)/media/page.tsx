"use client";
import { useState } from "react";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import { usePaginatedQuery } from "@/hooks/use-paginated-query";
import { useCrudMutations } from "@/hooks/use-crud-mutations";
import { getAccessToken, ApiError } from "@/lib/api-client";
import { uploadFiles } from "@/lib/upload";
import { FormDialog } from "@/components/shared/form-dialog";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface MediaItem { id: string; fileName: string; thumbnailUrl: string | null; type: string; altText: string | null; title: string | null }

export default function MediaPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const { data, isLoading, isError, error } = usePaginatedQuery < MediaItem > ("media", "/media", { page, limit: 24, search, type });
  const { update: updateMeta, remove } = useCrudMutations("media", "/media");
  const qc = useQueryClient();

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const token = getAccessToken();
    if (!token) return;
    setUploading(true); setProgress(0);
    try {
      await uploadFiles(token, files, setProgress);
      qc.invalidateQueries({ queryKey: ["media"] });
      toast.success(`Uploaded ${files.length} file(s)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally { setUploading(false); e.target.value = ""; }
  }

  const [editing, setEditing] = useState < MediaItem | null > (null);
  const [altText, setAltText] = useState(""); const [title, setTitle] = useState("");
  function openEdit(item: MediaItem) { setEditing(item); setAltText(item.altText ?? ""); setTitle(item.title ?? ""); }

  async function onSaveMeta(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try { await updateMeta.mutateAsync({ id: editing.id, body: { altText, title } }); setEditing(null); }
    catch { /* toast shown */ }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium">Media library</h1>
        <PermissionGate permission="media:upload">
          <div>
            <Input type="file" multiple accept="image/*,video/*" onChange={onUpload} disabled={uploading} className="hidden" id="file-upload" />
            <Label htmlFor="file-upload"><Button asChild><span>{uploading ? "Uploading…" : "Upload files"}</span></Button></Label>
          </div>
        </PermissionGate>
      </div>
      {uploading && <Progress value={progress} />}

      <div className="flex gap-2">
        <Input placeholder="Search…" onKeyDown={(e) => { if (e.key === "Enter") { setSearch((e.target as HTMLInputElement).value); setPage(1); } }} className="max-w-xs" />
        <select className="rounded border px-2 text-sm" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
          <option value="">All types</option><option value="image">Images</option><option value="video">Videos</option>
        </select>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {isError && <p className="text-red-600">{error instanceof ApiError ? error.message : "Failed to load"}</p>}
      {!isLoading && !isError && data?.data.length === 0 && <p className="text-muted-foreground">No media uploaded yet.</p>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6">
        {data?.data.map((item) => (
          <div key={item.id} className="space-y-1 rounded border p-2">
            <div className="relative aspect-square overflow-hidden rounded bg-muted">
              {item.thumbnailUrl ? <Image src={item.thumbnailUrl} alt={item.altText ?? item.fileName} fill className="object-cover" unoptimized />
                : <div className="flex h-full items-center justify-center text-xs text-muted-foreground">{item.type}</div>}
            </div>
            <p className="truncate text-xs">{item.fileName}</p>
            <div className="flex gap-1">
              <PermissionGate permission="media:write"><Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(item)}>Edit</Button></PermissionGate>
              <PermissionGate permission="media:delete"><Button variant="destructive" size="sm" onClick={() => { if (confirm(`Delete "${item.fileName}"?`)) remove.mutate(item.id); }}>Del</Button></PermissionGate>
            </div>
          </div>
        ))}
      </div>

      {data?.meta && data.meta.totalPages > 1 && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {data.meta.page} of {data.meta.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      <FormDialog title="Edit media" open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <form onSubmit={onSaveMeta} className="space-y-4">
          <div className="space-y-1"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="space-y-1"><Label>Alt text</Label><Input value={altText} onChange={(e) => setAltText(e.target.value)} /></div>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button type="submit">Save</Button></div>
        </form>
      </FormDialog>
    </div>
  );
}
