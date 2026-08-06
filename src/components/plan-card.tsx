import { Link } from "@tanstack/react-router";
import { Cpu, HardDrive, MemoryStick } from "lucide-react";
import type { McPlan } from "@/lib/constants";
import { useCurrency } from "@/lib/currency";
import { Button } from "@/components/ui/button";

export function PlanCard({ plan, tier }: { plan: McPlan; tier: "budget" | "premium" }) {
  const { price } = useCurrency();
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
        <Button className="mt-4 w-full" asChild>
          <Link to="/checkout" search={{ plan: plan.key, type: "minecraft" }}>
            Buy {plan.name}
          </Link>
        </Button>
      </div>
    </div>
  );
}
