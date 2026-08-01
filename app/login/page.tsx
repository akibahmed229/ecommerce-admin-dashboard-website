"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState < string | null > (null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setLoading(true);
    try { await login(email, password); }
    catch (err) { setError(err instanceof ApiError ? err.message : "Something went wrong"); }
    finally { setLoading(false); }
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-lg border p-6">
        <h1 className="text-lg font-medium">Sign in</h1>
        {error && <p className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
        <div className="space-y-1"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div className="space-y-1"><Label htmlFor="password">Password</Label><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</Button>
      </form>
    </div>
  );
}
