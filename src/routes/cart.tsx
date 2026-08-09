import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useCurrency } from "@/lib/currency";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — NETHOST Hosting" },
      { name: "description", content: "Review your selected Minecraft and VPS hosting plans before checkout." },
      { property: "og:title", content: "Your Cart — NETHOST Hosting" },
      { property: "og:description", content: "Review your selected Minecraft and VPS hosting plans before checkout." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const cart = useCart();
  const { price } = useCurrency();

  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <h1 className="font-display text-3xl font-bold md:text-4xl">Your cart</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Each plan is checked out individually so we can provision the right node and egg.
      </p>

      {cart.items.length === 0 ? (
        <div className="panel mt-10 flex flex-col items-center gap-4 p-12 text-center">
          <ShoppingCart className="size-10 text-primary" />
          <p className="text-muted-foreground">Your cart is empty.</p>
          <div className="flex gap-3">
            <Button asChild>
              <Link to="/minecraft">Minecraft plans</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/vps">VPS plans</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {cart.items.map((i) => (
              <div key={i.key} className="panel flex flex-wrap items-center gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-bold">{i.name}</p>
                  <p className="text-xs text-muted-foreground">{i.meta ?? i.type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-md border border-border p-1.5"
                    aria-label="Decrease"
                    onClick={() => cart.setQty(i.key, i.qty - 1)}
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm">{i.qty}</span>
                  <button
                    className="rounded-md border border-border p-1.5"
                    aria-label="Increase"
                    onClick={() => cart.setQty(i.key, i.qty + 1)}
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
                <span className="w-24 text-right font-display text-lg font-bold text-primary">
                  {price(i.price * i.qty)}
                </span>
                <Button size="sm" asChild>
                  <Link to="/checkout" search={{ plan: i.key, type: i.type }}>
                    Checkout
                  </Link>
                </Button>
                <button onClick={() => cart.remove(i.key)} aria-label="Remove">
                  <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>

          <aside className="panel h-fit space-y-4 p-6">
            <h2 className="font-display text-lg font-bold">Summary</h2>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Items</span>
              <span>{cart.count}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total / month</span>
              <span className="font-display text-2xl font-bold text-primary">{price(cart.total)}</span>
            </div>
            <Button variant="secondary" className="w-full" onClick={cart.clear}>
              Clear cart
            </Button>
          </aside>
        </div>
      )}
    </div>
  );
}
