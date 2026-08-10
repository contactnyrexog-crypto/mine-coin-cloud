import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, ShoppingCart, ChevronDown, Trash2, Minus, Plus } from "lucide-react";
import { signOutLocal } from "@/lib/local-db";
import { useAuth } from "@/lib/use-auth";
import { useCurrency } from "@/lib/currency";
import { useCart } from "@/lib/cart";
import { CURRENCIES, type CurrencyCode, BRAND } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import logo from "@/assets/nethost-logo.png";

const HOSTING = [
  { to: "/minecraft", label: "Minecraft Hosting", desc: "Budget & premium nodes" },
  { to: "/vps", label: "VPS Hosting", desc: "8GB – 64GB RAM" },
  { to: "/free", label: "Free Panel", desc: "Earn coins, get servers" },
] as const;

const LINKS = [
  { to: "/payments", label: "Orders" },
  { to: "/terms", label: "Terms" },
] as const;

export function SiteHeader() {
  const { user, isAdmin } = useAuth();
  const { currency, setCurrency, price } = useCurrency();
  const cart = useCart();
  const [open, setOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    signOutLocal();
    navigate({ to: "/auth", replace: true });
  }

  const linkCls =
    "rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground";
  const activeCls = "rounded-full px-4 py-2 text-sm font-medium text-primary bg-primary/15";

  return (
    <header className="sticky top-0 z-50 px-3 pt-3">
      <div className="mx-auto flex max-w-7xl items-center gap-3 rounded-2xl border border-primary/20 bg-background/70 px-3 py-2 shadow-[0_0_40px_-20px_hsl(var(--primary)/0.9)] backdrop-blur-xl sm:px-4">
        <Link to="/" className="flex min-w-0 shrink-0 items-center gap-2 font-display text-lg font-bold tracking-tight">
          <img src={logo} alt="NETHOST logo" width={32} height={32} className="size-8 shrink-0" />
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">NETHOST</span>
        </Link>

        <nav className="mx-auto hidden items-center gap-1 lg:flex">
          <Link to="/" className={linkCls} activeProps={{ className: activeCls }} activeOptions={{ exact: true }}>
            Home
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger className={`${linkCls} inline-flex items-center gap-1 outline-none`}>
              Hosting <ChevronDown className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-64">
              {HOSTING.map((h) => (
                <DropdownMenuItem key={h.to} asChild>
                  <Link to={h.to} className="flex flex-col items-start gap-0.5">
                    <span className="text-sm font-medium">{h.label}</span>
                    <span className="text-xs text-muted-foreground">{h.desc}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {LINKS.map((n) => (
            <Link key={n.to} to={n.to} className={linkCls} activeProps={{ className: activeCls }}>
              {n.label}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin/payments" className={`${linkCls} text-gold`}>
              Admin
            </Link>
          )}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <select
            aria-label="Currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="hidden rounded-full border border-border bg-secondary px-3 py-1.5 text-sm text-foreground sm:block"
          >
            {Object.keys(CURRENCIES).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            onClick={() => setCartOpen(true)}
            aria-label={`Cart, ${cart.count} items`}
            className="relative rounded-full border border-border bg-secondary p-2 text-foreground transition-colors hover:border-primary/60 hover:text-primary"
          >
            <ShoppingCart className="size-4" />
            {cart.count > 0 && (
              <span className="absolute -right-1 -top-1 grid size-4.5 min-w-4.5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {cart.count}
              </span>
            )}
          </button>

          {user ? (
            <Button variant="secondary" size="sm" className="rounded-full" onClick={signOut}>
              Sign out
            </Button>
          ) : (
            <Button size="sm" className="rounded-full" asChild>
              <Link to="/auth">Client Area</Link>
            </Button>
          )}

          <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="mx-auto mt-2 flex max-w-7xl flex-col gap-1 rounded-2xl border border-primary/20 bg-background/95 p-3 backdrop-blur-xl lg:hidden">
          <Link to="/" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm">
            Home
          </Link>
          {[...HOSTING, ...LINKS].map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm">
              {n.label}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin/payments" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm text-gold">
              Admin
            </Link>
          )}
        </nav>
      )}

      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="flex w-full flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Your cart</SheetTitle>
            <SheetDescription>Monthly hosting plans, billed per server.</SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-3 overflow-y-auto px-4">
            {cart.items.length === 0 && <p className="text-sm text-muted-foreground">Your cart is empty.</p>}
            {cart.items.map((i) => (
              <div key={i.key} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{i.name}</p>
                    <p className="text-xs text-muted-foreground">{i.meta ?? i.type}</p>
                  </div>
                  <button onClick={() => cart.remove(i.key)} aria-label="Remove">
                    <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-md border border-border p-1"
                      aria-label="Decrease"
                      onClick={() => cart.setQty(i.key, i.qty - 1)}
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm">{i.qty}</span>
                    <button
                      className="rounded-md border border-border p-1"
                      aria-label="Increase"
                      onClick={() => cart.setQty(i.key, i.qty + 1)}
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-primary">{price(i.price * i.qty)}</span>
                </div>
              </div>
            ))}
          </div>

          <SheetFooter>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total / month</span>
              <span className="font-display text-xl font-bold text-primary">{price(cart.total)}</span>
            </div>
            <Button asChild disabled={cart.items.length === 0}>
              <Link to="/cart" onClick={() => setCartOpen(false)}>
                View cart & checkout
              </Link>
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <span className="sr-only">{BRAND}</span>
    </header>
  );
}
