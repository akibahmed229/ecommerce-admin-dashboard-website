"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", permission: "dashboard:watch" },
  { label: "Permissions", href: "/permissions", permission: "permission:watch" },
  { label: "Roles", href: "/roles", permission: "role:watch" },
  { label: "Users", href: "/users", permission: "user:watch" },
  { label: "Media", href: "/media", permission: "media:watch" },
  { label: "Categories", href: "/categories", permission: "category:watch" },
  { label: "Brands", href: "/brands", permission: "brand:watch" },
  { label: "Attributes", href: "/attributes", permission: "attribute:watch" },
];

export function Sidebar() {
  const { hasPermission } = useAuth();
  const pathname = usePathname();
  return (
    <aside className="w-56 shrink-0 border-r p-4">
      <p className="mb-4 px-2 text-sm font-medium">Admin</p>
      <nav className="space-y-1">
        {NAV_ITEMS.filter((i) => hasPermission(i.permission)).map((i) => (
          <Link key={i.href} href={i.href} className={cn("block rounded px-2 py-1.5 text-sm hover:bg-muted", pathname === i.href && "bg-muted font-medium")}>{i.label}</Link>
        ))}
      </nav>
    </aside>
  );
}
