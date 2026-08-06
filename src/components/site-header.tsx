import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useCurrency } from "@/lib/currency";
import { CURRENCIES, type CurrencyCode, BRAND } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/free", label: "Free" },
  { to: "/minecraft", label: "Minecraft" },
  { to: "/vps", label: "VPS" },
  { to: "/payments", label: "Payments" },
];

export function SiteHeader() {
  const { user } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }) => setIsAdmin((data ?? []).some((r) => r.role === "admin")));
  }, [user]);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link to="/" className="font-display text-lg font-bold tracking-tight">
          <span className="text-primary">NETHOST</span>
          <span className="text-muted-foreground"> x </span>
          <span className="text-accent">MENTION HOST</span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "rounded-md px-3 py-2 text-sm text-primary bg-secondary" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/admin/payments"
              className="rounded-md px-3 py-2 text-sm text-gold transition-colors hover:bg-secondary"
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <select
            aria-label="Currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="rounded-md border border-border bg-secondary px-2 py-1.5 text-sm text-foreground"
          >
            {Object.keys(CURRENCIES).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {user ? (
            <Button variant="secondary" size="sm" onClick={signOut}>
              Sign out
            </Button>
          ) : (
            <Button size="sm" asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
          )}

          <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-border/60 px-4 py-3 md:hidden">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm">
              {n.label}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin/payments" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm text-gold">
              Admin
            </Link>
          )}
        </nav>
      )}
      <span className="sr-only">{BRAND}</span>
    </header>
  );
}
