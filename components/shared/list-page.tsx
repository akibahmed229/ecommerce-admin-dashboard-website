"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ListPageProps<T> {
  title: string; isLoading: boolean; isError: boolean; errorMessage?: string;
  data: T[] | undefined; meta?: { page: number; totalPages: number; total: number };
  onSearch: (v: string) => void; onPageChange: (p: number) => void;
  actions?: React.ReactNode; columns: string[]; renderRow: (item: T) => React.ReactNode; emptyMessage?: string;
}

export function ListPage<T>({ title, isLoading, isError, errorMessage, data, meta, onSearch, onPageChange, actions, columns, renderRow, emptyMessage }: ListPageProps<T>) {
  const [search, setSearch] = useState("");
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-medium">{title}</h1>{actions}</div>
      <div className="flex gap-2">
        <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onSearch(search)} className="max-w-xs" />
        <Button variant="secondary" onClick={() => onSearch(search)}>Search</Button>
      </div>
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50"><tr>{columns.map((c) => <th key={c} className="p-3 text-left font-medium">{c}</th>)}</tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={columns.length} className="p-6 text-center text-muted-foreground">Loading…</td></tr>}
            {isError && <tr><td colSpan={columns.length} className="p-6 text-center text-red-600">{errorMessage ?? "Failed to load"}</td></tr>}
            {!isLoading && !isError && data?.length === 0 && <tr><td colSpan={columns.length} className="p-6 text-center text-muted-foreground">{emptyMessage ?? "Nothing here yet"}</td></tr>}
            {!isLoading && !isError && data?.map(renderRow)}
          </tbody>
        </table>
      </div>
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => onPageChange(meta.page - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {meta.page} of {meta.totalPages} ({meta.total} total)</span>
          <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => onPageChange(meta.page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
