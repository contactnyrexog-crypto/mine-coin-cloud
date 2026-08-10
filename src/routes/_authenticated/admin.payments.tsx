import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@/lib/local-fn";
import { toast } from "sonner";
import { adminListOrders, adminDecideOrder } from "@/lib/admin.functions";
import { getProofImage } from "@/lib/orders.functions";
import { CURRENCIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/payments")({
  validateSearch: (s: Record<string, unknown>): { order?: string | undefined; action?: string | undefined } => ({
    order: s["order"] ? String(s["order"]) : undefined,
    action: s["action"] === "accept" || s["action"] === "reject" ? (s["action"] as string) : undefined,
  }),
  component: AdminPayments,
});

function AdminPayments() {
  const search = useSearch({ from: "/_authenticated/admin/payments" });
  const listFn = useServerFn(adminListOrders);
  const { data: orders } = useQuery({ queryKey: ["admin-orders"], queryFn: () => listFn({}) });

  return (
    <div className="space-y-4">
      {!orders?.length && <p className="text-sm text-muted-foreground">No orders yet.</p>}
      {(orders ?? []).map((o: any) => (
        <AdminOrderCard key={o.id} order={o} focus={search.order === o.id ? search.action : undefined} />
      ))}
    </div>
  );
}

function AdminOrderCard({ order, focus }: { order: any; focus?: string | undefined }) {
  const decide = useServerFn(adminDecideOrder);
  const qc = useQueryClient();
  const [panel, setPanel] = useState<"none" | "accept" | "reject">("none");
  const [reason, setReason] = useState("");
  const [vps, setVps] = useState({ username: "", ip: "", location: "", keyUrl: "" });
  const [busy, setBusy] = useState(false);
  const symbol = CURRENCIES[order.currency as "INR"]?.symbol ?? "";

  useEffect(() => {
    if (focus === "accept" || focus === "reject") setPanel(focus);
  }, [focus]);

  async function run(action: "accept" | "reject") {
    setBusy(true);
    try {
      await decide({
        data: {
          orderId: order.id,
          action,
          ...(action === "reject" ? { reason } : {}),
          ...(action === "accept" && order.product_type === "vps" ? vps : {}),
        },
      });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      setPanel("none");
      toast.success(action === "accept" ? "Order accepted" : "Order rejected");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const proof = getProofImage(order.id);

  return (

    <div className="panel space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-bold">
            {order.plan_name}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              · {order.product_type.toUpperCase()}
              {order.plan_tier ? ` · ${order.plan_tier}` : ""}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            {order.billing_email} · {order.payment_method.toUpperCase()} · {symbol}
            {order.amount}
            {order.coupon_code ? ` · coupon ${order.coupon_code}` : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            Paid at: {order.paid_at ? new Date(order.paid_at).toLocaleString() : "—"}
          </p>
          {order.billing_address && (
            <p className="mt-1 max-w-lg text-xs text-muted-foreground">{order.billing_address}</p>
          )}
        </div>
        <span className="font-display text-sm font-bold uppercase text-primary">{order.status}</span>
      </div>

      {proof ? (
        <a href={proof} target="_blank" rel="noreferrer noopener">
          <img src={proof} alt="Payment proof" className="max-h-56 rounded-lg border border-border" />
        </a>
      ) : (
        order.proof_url && (
          <p className="text-xs text-muted-foreground">
            Screenshot was uploaded from another browser, so it isn't available here.
          </p>
        )
      )}


      {order.reject_reason && (
        <p className="text-sm text-destructive">Reject reason: {order.reject_reason}</p>
      )}

      {panel === "none" && order.status === "pending" && (
        <div className="flex gap-3">
          <Button onClick={() => setPanel("accept")}>Accept</Button>
          <Button variant="destructive" onClick={() => setPanel("reject")}>
            Reject
          </Button>
        </div>
      )}

      {panel === "accept" && (
        <div className="space-y-3 rounded-md border border-border p-4">
          {order.product_type === "vps" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["username", "Username"],
                  ["ip", "IP"],
                  ["location", "Location"],
                  ["keyUrl", "Key file download link"],
                ] as const
              ).map(([k, label]) => (
                <div key={k} className="space-y-1">
                  <Label className="text-xs">{label}</Label>
                  <Input value={vps[k]} onChange={(e) => setVps({ ...vps, [k]: e.target.value })} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Accepting lets the buyer create their server on the correct node automatically.
            </p>
          )}
          <div className="flex gap-3">
            <Button disabled={busy} onClick={() => run("accept")}>
              {busy ? "Saving…" : "Confirm accept"}
            </Button>
            <Button variant="secondary" onClick={() => setPanel("none")}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {panel === "reject" && (
        <div className="space-y-3 rounded-md border border-border p-4">
          <Label className="text-xs">Why are you rejecting this payment?</Label>
          <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex gap-3">
            <Button variant="destructive" disabled={busy || !reason.trim()} onClick={() => run("reject")}>
              {busy ? "Saving…" : "Confirm reject"}
            </Button>
            <Button variant="secondary" onClick={() => setPanel("none")}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
