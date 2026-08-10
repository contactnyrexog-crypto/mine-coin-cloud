import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@/lib/local-fn";
import { toast } from "sonner";
import { redeemCode } from "@/lib/free.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/free/redeem")({
  component: RedeemPage,
});

function RedeemPage() {
  const redeem = useServerFn(redeemCode);
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await redeem({ data: { code } });
      qc.invalidateQueries({ queryKey: ["profile"] });
      const parts = [
        r.coins ? `${r.coins} coins` : null,
        r.ram_mb ? `${r.ram_mb} MB RAM` : null,
        r.disk_gb ? `${r.disk_gb} GB disk` : null,
        r.cpu_percent ? `${r.cpu_percent}% CPU` : null,
      ].filter(Boolean);
      toast.success(`Redeemed! You received ${parts.join(", ") || "nothing"}.`);
      setCode("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not redeem code");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="panel mx-auto max-w-md space-y-5 p-8">
      <div>
        <h2 className="font-display text-2xl font-bold">Redeem a code</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Free-panel codes grant coins and resources instantly. Minecraft discount coupons are entered at checkout.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="code">Code</Label>
        <Input
          id="code"
          required
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="NETHOST2026"
          className="uppercase tracking-widest"
        />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Redeeming…" : "Redeem"}
      </Button>
    </form>
  );
}
