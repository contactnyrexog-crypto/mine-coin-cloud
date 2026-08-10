import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@/lib/local-fn";
import { toast } from "sonner";
import { buyShopItem } from "@/lib/free.functions";
import { SHOP_ITEMS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/free/shop")({
  component: ShopPage,
});

function ShopPage() {
  const buy = useServerFn(buyShopItem);
  const qc = useQueryClient();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState("");

  async function purchase(item: string) {
    setBusy(item);
    try {
      await buy({ data: { item, qty: qty[item] || 1 } });
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Purchased!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {SHOP_ITEMS.map((item) => (
        <div key={item.key} className="panel flex flex-col gap-4 p-6">
          <h2 className="font-display text-xl font-bold">{item.label}</h2>
          <p className="text-sm text-muted-foreground">
            Adds {item.amount} {item.unit} to your free panel allowance.
          </p>
          <p className="font-display text-2xl font-bold text-accent">{item.price} coins</p>
          <Input
            type="number"
            min={1}
            max={50}
            value={qty[item.key] ?? 1}
            onChange={(e) => setQty({ ...qty, [item.key]: Number(e.target.value) })}
          />
          <Button disabled={busy === item.key} onClick={() => purchase(item.key)}>
            {busy === item.key ? "Buying…" : `Buy for ${item.price * (qty[item.key] ?? 1)} coins`}
          </Button>
        </div>
      ))}
    </div>
  );
}
