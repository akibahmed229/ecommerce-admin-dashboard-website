"use client";
import { useState } from "react";
import Image from "next/image";
import { usePaginatedQuery } from "@/hooks/use-paginated-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MediaItem { id: string; fileName: string; thumbnailUrl: string | null }

export function MediaPicker({ value, onChange }: { value?: string; onChange: (mediaId: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data } = usePaginatedQuery < MediaItem > ("media-picker", "/media", { page: 1, limit: 20, search, type: "image" });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger><Button type="button" variant="outline" size="sm">{value ? "Change image" : "Choose from library"}</Button></DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Choose an image</DialogTitle></DialogHeader>
        <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="grid max-h-96 grid-cols-4 gap-2 overflow-y-auto">
          {data?.data.map((item) => (
            <button key={item.id} type="button" className="relative aspect-square overflow-hidden rounded border hover:ring-2 hover:ring-primary" onClick={() => { onChange(item.id); setOpen(false); }}>
              {item.thumbnailUrl && <Image src={item.thumbnailUrl} alt={item.fileName} fill className="object-cover" unoptimized />}
            </button>
          ))}
          {data?.data.length === 0 && <p className="col-span-4 py-8 text-center text-sm text-muted-foreground">No images yet — upload some in Media first.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
