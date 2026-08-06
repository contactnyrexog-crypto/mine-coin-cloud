import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — NETHOST x MENTION HOST" },
      { name: "description", content: "Sign in or create your NetHost x Mention Host account to manage hosting." },
      { property: "og:title", content: "Sign in — NETHOST x MENTION HOST" },
      { property: "og:description", content: "Access your free panel, orders and servers." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({ redirect: typeof s["redirect"] === "string" ? s["redirect"] : "" }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/auth" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        const to = redirect && redirect.startsWith("/") ? redirect : "/free";
        window.location.href = to;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created. Check your email to confirm, then sign in.");
        setMode("in");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-20">
      <h1 className="font-display text-3xl font-bold">{mode === "in" ? "Sign in" : "Create account"}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        One account for the free panel, Minecraft plans and VPS orders.
      </p>
      <form onSubmit={submit} className="panel mt-8 space-y-4 p-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button className="w-full" disabled={busy} type="submit">
          {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Sign up"}
        </Button>
        <button
          type="button"
          className="w-full text-sm text-muted-foreground hover:text-primary"
          onClick={() => setMode(mode === "in" ? "up" : "in")}
        >
          {mode === "in" ? "No account? Create one" : "Already have an account? Sign in"}
        </button>
      </form>
      <button className="mt-6 text-xs text-muted-foreground" onClick={() => navigate({ to: "/" })}>
        Back to home
      </button>
    </div>
  );
}
