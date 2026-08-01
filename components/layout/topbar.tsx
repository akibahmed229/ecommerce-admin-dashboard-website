"use client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export function Topbar() {
  const { user, logout } = useAuth();
  return (
    <header className="flex items-center justify-between border-b p-4">
      <span />
      <div className="flex items-center gap-3 text-sm">
        <span>{user?.name} <span className="text-muted-foreground">· {user?.roleName}</span></span>
        <Button variant="outline" size="sm" onClick={logout}>Log out</Button>
      </div>
    </header>
  );
}
