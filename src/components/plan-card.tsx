import { Link } from "@tanstack/react-router";
import { Cpu, HardDrive, MemoryStick, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import type { McPlan } from "@/lib/constants";
import { useCurrency } from "@/lib/currency";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";

export function PlanCard({ plan, tier }: { plan: McPlan; tier: "budget" | "premium" }) {
  const { price } = useCurrency();
  const cart = useCart();
  return (
    <div className="panel flex flex-col gap-4 p-6 transition-transform hover:-translate-y-1">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{plan.icon}</span>
        <h3 className="font-display text-lg font-bold">{plan.name}</h3>
      </div>
      <ul className="space-y-2 text-sm text-muted-foreground">
        <li className="flex items-center gap-2">
          <MemoryStick className="size-4 text-primary" /> {plan.ram}GB RAM
        </li>
        <li className="flex items-center gap-2">
          <Cpu className="size-4 text-primary" /> {plan.cores}
        </li>
        <li className="flex items-center gap-2">
          <HardDrive className="size-4 text-primary" /> {plan.disk}GB NVMe
        </li>
      </ul>
      <div className="mt-auto">
        <p className="font-display text-3xl font-bold text-primary">{price(plan.price)}</p>
        <p className="text-xs text-muted-foreground">per month · {tier === "premium" ? "Ryzen 9 9950X" : "EPYC 7"}</p>
        <div className="mt-4 flex gap-2">
          <Button className="flex-1" asChild>
            <Link to="/checkout" search={{ plan: plan.key, type: "minecraft" }}>
              Buy now
            </Link>
          </Button>
          <Button
            variant="secondary"
            size="icon"
            aria-label={`Add ${plan.name} to cart`}
            onClick={() => {
              cart.add({
                key: plan.key,
                name: `${tier === "premium" ? "Premium" : "Budget"} ${plan.name}`,
                type: "minecraft",
                price: plan.price,
                meta: `${plan.ram}GB RAM · ${plan.cores} · ${plan.disk}GB NVMe`,
              });
              toast.success(`${plan.name} added to cart`);
            }}
          >
            <ShoppingCart className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
