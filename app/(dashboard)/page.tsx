"use client";
import { useAuth } from "@/lib/auth-context";

export default function DashboardHome() {
  const { user } = useAuth();
  return (
    <div>
      <h1 className="text-xl font-medium">Welcome, {user?.name}</h1>
      <p className="text-muted-foreground">Role: {user?.roleName} · {user?.permissions.length} permissions granted</p>
    </div>
  );
}
