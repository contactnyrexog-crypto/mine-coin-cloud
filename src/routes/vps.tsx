import { createFileRoute, Link } from "@tanstack/react-router";
import { Server } from "lucide-react";
import { VPS_PLANS } from "@/lib/constants";
import { useCurrency } from "@/lib/currency";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/vps")({
  head: () => ({
    meta: [
      { title: "VPS Hosting Plans — NETHOST" },
      {
        name: "description",
        content: "High-memory VPS from 8GB to 64GB RAM starting at ₹100/mo, with key-file access and fast delivery.",
      },
      { property: "og:title", content: "VPS Hosting Plans — NETHOST" },
      { property: "og:description", content: "8GB to 64GB RAM VPS plans with root SSH key access." },
    ],
  }),
  component: VpsPage,
});

function VpsPage() {
  const { price } = useCurrency();
  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <h1 className="font-display text-4xl font-bold md:text-5xl">VPS Hosting</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Root access, generous memory and SSH key delivery. Prices shown in your selected currency.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {VPS_PLANS.map((p) => (
          <div key={p.key} className="panel flex flex-col gap-4 p-6 transition-transform hover:-translate-y-1">
            <Server className="size-7 text-accent" />
            <h2 className="font-display text-2xl font-bold">{p.name}</h2>
            <p className="text-sm text-muted-foreground">{p.ram}GB dedicated RAM · NVMe storage · Root access</p>
            <div className="mt-auto">
              <p className="font-display text-3xl font-bold text-primary">{price(p.price)}</p>
              <p className="text-xs text-muted-foreground">per month</p>
              <Button className="mt-4 w-full" asChild>
                <Link to="/checkout" search={{ plan: p.key, type: "vps" }}>
                  Buy {p.name}
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
