"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function FormDialog({ title, open, onOpenChange, children }: { title: string; open: boolean; onOpenChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-1">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
