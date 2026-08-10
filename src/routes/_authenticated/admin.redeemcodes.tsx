import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@/lib/local-fn";
import { toast } from "sonner";
import { adminListCodes, adminCreateCode, adminToggleCode } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/admin/redeemcodes")({
  component: AdminCodes,
});

const EMPTY = {
  code: "",
  kind: "free" as "free" | "minecraft",
  coins: 0,
  ram: 0,
  disk: 0,
  cpu: 0,
  discountPercent: 0,
  discountInr: 0,
  usesPerUser: 1,
  maxUses: 1,
};

function AdminCodes() {
  const listFn = useServerFn(adminListCodes);
  const createFn = useServerFn(adminCreateCode);
  const toggleFn = useServerFn(adminToggleCode);
  const qc = useQueryClient();
  const { data: codes } = useQuery({ queryKey: ["admin-codes"], queryFn: () => listFn({}) });
  const [f, setF] = useState({ ...EMPTY });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await createFn({ data: f });
      qc.invalidateQueries({ queryKey: ["admin-codes"] });
      setF({ ...EMPTY });
      toast.success("Code created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const num = (k: keyof typeof EMPTY, label: string) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        value={f[k] as number}
        onChange={(e) => setF({ ...f, [k]: Number(e.target.value) })}
      />
    </div>
  );

  return (
    <div className="space-y-8">
      <form onSubmit={submit} className="panel space-y-5 p-6">
        <h2 className="font-display text-xl font-bold">Create a code</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Code</Label>
            <Input required value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Type</Label>
            <select
              value={f.kind}
              onChange={(e) => setF({ ...f, kind: e.target.value as "free" | "minecraft" })}
              className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
            >
              <option value="free">Free panel (coins / resources)</option>
              <option value="minecraft">Minecraft & VPS discount coupon</option>
            </select>
          </div>
        </div>

        {f.kind === "free" ? (
          <div className="grid gap-3 sm:grid-cols-4">
            {num("coins", "Coins")}
            {num("ram", "RAM (MB)")}
            {num("disk", "Disk (GB)")}
            {num("cpu", "CPU (%)")}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {num("discountPercent", "Discount (%)")}
            {num("discountInr", "Discount (INR — applies to INR & PKR)")}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {num("usesPerUser", "Uses per user")}
          {num("maxUses", "Total uses")}
        </div>

        <Button type="submit" disabled={busy}>
          {busy ? "Creating…" : "Create code"}
        </Button>
      </form>

      <div className="space-y-3">
        {(codes ?? []).map((c: any) => (
          <div key={c.id} className="panel flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-display font-bold tracking-widest">{c.code}</p>
              <p className="text-xs text-muted-foreground">
                {c.kind === "free"
                  ? `${c.coins} coins · ${c.ram_mb} MB · ${c.disk_gb} GB · ${c.cpu_percent}%`
                  : `${c.discount_percent}% + ₹${c.discount_inr} off`}{" "}
                · {c.used_count}/{c.max_uses} used · {c.uses_per_user}/user
              </p>
            </div>
            <Button
              size="sm"
              variant={c.active ? "secondary" : "default"}
              onClick={async () => {
                await toggleFn({ data: { id: c.id, active: !c.active } });
                qc.invalidateQueries({ queryKey: ["admin-codes"] });
              }}
            >
              {c.active ? "Disable" : "Enable"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
