import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { listMyOrders, provisionMinecraftOrder } from "@/lib/orders.functions";
import { EGGS, CURRENCIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/payments")({
  component: PaymentsPage,
});

const STATUS_STYLE: Record<string, string> = {
  pending: "text-gold",
  accepted: "text-primary",
  delivered: "text-primary",
  rejected: "text-destructive",
};

function PaymentsPage() {
  const fn = useServerFn(listMyOrders);
  const { data: orders } = useQuery({ queryKey: ["my-orders"], queryFn: () => fn({}) });

  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <h1 className="font-display text-3xl font-bold">Payments</h1>
      <p className="mt-2 text-sm text-muted-foreground">Track your orders, verification status and delivery.</p>

      {!orders?.length ? (
        <div className="panel mt-8 p-8 text-center text-sm text-muted-foreground">No orders yet.</div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: any }) {
  const provision = useServerFn(provisionMinecraftOrder);
  const qc = useQueryClient();
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [email, setEmail] = useState(order.billing_email ?? "");
  const [password, setPassword] = useState("");
  const [serverName, setServerName] = useState("");
  const [egg, setEgg] = useState("paper");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const delivery = (order.delivery ?? {}) as Record<string, string>;
  const symbol = CURRENCIES[order.currency as "INR"]?.symbol ?? "";

  async function go() {
    setBusy(true);
    try {
      const r = await provision({
        data: {
          orderId: order.id,
          mode,
          email,
          ...(mode === "new" ? { password } : {}),
          serverName,
          egg,
        },
      });
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      toast.success(`Server created on ${r.node} (${r.identifier})`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Provisioning failed");
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <div className="panel space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg font-bold">
            {order.plan_name}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              · {order.product_type.toUpperCase()}
              {order.plan_tier ? ` · ${order.plan_tier}` : ""}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            {order.payment_method.toUpperCase()} · {symbol}
            {order.amount} · {new Date(order.created_at).toLocaleString()}
          </p>
        </div>
        <span className={`font-display text-sm font-bold uppercase ${STATUS_STYLE[order.status] ?? ""}`}>
          {order.status}
        </span>
      </div>

      {order.status === "pending" && (
        <p className="text-sm text-muted-foreground">
          Wait for a few minutes — the payment is being verified by our team.
        </p>
      )}

      {order.status === "rejected" && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <span className="text-muted-foreground">Payment reject reason:</span> {order.reject_reason}
        </p>
      )}

      {order.status === "delivered" && order.product_type === "minecraft" && (
        <div className="rounded-md border border-primary/40 bg-primary/10 p-3 text-sm">
          Server ready on <span className="font-bold">{delivery["node"]}</span> · ID{" "}
          <span className="font-mono">{delivery["identifier"]}</span> · panel login {delivery["panelEmail"]}
        </div>
      )}

      {order.status === "accepted" && order.product_type === "vps" && (
        <div className="space-y-2 rounded-md border border-primary/40 bg-primary/10 p-4 text-sm">
          <p>
            <span className="text-muted-foreground">Username:</span> {delivery["username"]}
          </p>
          <p>
            <span className="text-muted-foreground">IP:</span> {delivery["ip"]}
          </p>
          <p>
            <span className="text-muted-foreground">Location:</span> {delivery["location"]}
          </p>
          {delivery["keyUrl"] && (
            <Button size="sm" asChild>
              <a href={delivery["keyUrl"]} target="_blank" rel="noreferrer noopener">
                <Download className="mr-2 size-4" /> Download key file by clicking here
              </a>
            </Button>
          )}
        </div>
      )}

      {order.status === "accepted" && order.product_type === "minecraft" && (
        <div className="space-y-4 rounded-md border border-border p-4">
          <p className="font-display text-sm font-bold">Payment accepted — create your server</p>
          <div className="flex gap-3">
            {(["new", "existing"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-md border px-3 py-2 text-sm ${
                  mode === m ? "border-primary bg-primary/10" : "border-border"
                }`}
              >
                {m === "new" ? "Create a new panel account" : "Use existing account"}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Panel email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {mode === "new" && (
              <div className="space-y-2">
                <Label>Panel password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Server name</Label>
              <Input value={serverName} onChange={(e) => setServerName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Egg</Label>
              <select
                value={egg}
                onChange={(e) => setEgg(e.target.value)}
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
              >
                {EGGS.filter((x) => x.type === "minecraft").map((x) => (
                  <option key={x.key} value={x.key}>
                    {x.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!confirming ? (
            <Button onClick={() => setConfirming(true)} disabled={!email || !serverName}>
              Proceed
            </Button>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-muted-foreground">Are you really sure? Confirm to create the server.</p>
              <Button onClick={go} disabled={busy}>
                {busy ? "Creating…" : "Yes, confirm"}
              </Button>
              <Button variant="secondary" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
