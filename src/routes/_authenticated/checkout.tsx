import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, Upload } from "lucide-react";
import { createOrder, submitPaymentProof } from "@/lib/orders.functions";
import { getMyProfile } from "@/lib/free.functions";
import { findPlan, PAY_METHODS, UPI_QR, BUDGET_PLANS } from "@/lib/constants";
import { useCurrency } from "@/lib/currency";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

type Search = { plan: string; type: "minecraft" | "vps" };

export const Route = createFileRoute("/_authenticated/checkout")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    plan: String(s["plan"] ?? ""),
    type: s["type"] === "vps" ? "vps" : "minecraft",
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { plan: planKey, type } = Route.useSearch();
  const navigate = useNavigate();
  const { currency, price } = useCurrency();
  const plan = findPlan(planKey);

  const profileFn = useServerFn(getMyProfile);
  const create = useServerFn(createOrder);
  const submitProof = useServerFn(submitPaymentProof);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [coupon, setCoupon] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [save, setSave] = useState(true);
  const [method, setMethod] = useState<"jazzcash" | "easypaisa" | "upi">("jazzcash");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    profileFn({}).then((r) => {
      if (r.profile?.billing_email) setEmail(r.profile.billing_email);
      if (r.profile?.billing_address) setAddress(r.profile.billing_address);
    });
  }, [profileFn]);

  if (!plan) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Plan not found</h1>
        <Button className="mt-6" asChild>
          <Link to="/minecraft">Browse plans</Link>
        </Button>
      </div>
    );
  }

  const tier = BUDGET_PLANS.some((p) => p.key === plan.key) ? "budget" : "premium";
  const chosen = PAY_METHODS.find((m) => m.key === method)!;

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const order = await create({
        data: {
          productType: type,
          ...(coupon.trim() ? { couponCode: coupon.trim() } : {}),
          planKey,
          currency,
          billingEmail: email,
          billingAddress: address,
          paymentMethod: method,
          saveBilling: save,
        },
      });
      setOrderId(order.id);
      setStep(2);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create order");
    } finally {
      setBusy(false);
    }
  }

  async function uploadProof() {
    if (!file || !orderId) return;
    setBusy(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${auth.user!.id}/${orderId}.${ext}`;
      const { error } = await supabase.storage.from("payment-proofs").upload(path, file, { upsert: true });
      if (error) throw new Error(error.message);
      await submitProof({ data: { orderId, path, origin: window.location.origin } });
      setStep(4);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="font-display text-3xl font-bold">Checkout</h1>

      <div className="panel mt-6 flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="font-display text-xl font-bold">{plan.name}</p>
          <p className="text-sm text-muted-foreground">
            {type === "vps" ? `${(plan as { ram: number }).ram}GB RAM VPS` : `${tier} plan`}
          </p>
        </div>
        <p className="font-display text-2xl font-bold text-primary">{price(plan.price)}</p>
      </div>

      {step === 1 && (
        <form onSubmit={placeOrder} className="panel mt-6 space-y-5 p-6">
          <div className="space-y-2">
            <Label htmlFor="coupon">Coupon code (optional)</Label>
            <Input id="coupon" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bemail">Billing email</Label>
            <Input id="bemail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="baddr">Billing address</Label>
            <Textarea id="baddr" rows={3} value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={save} onCheckedChange={(v) => setSave(Boolean(v))} /> Save billing details for future
            orders
          </label>

          <div className="space-y-2">
            <Label>Payment method</Label>
            <div className="grid gap-3 sm:grid-cols-3">
              {PAY_METHODS.map((m) => (
                <button
                  type="button"
                  key={m.key}
                  onClick={() => setMethod(m.key as typeof method)}
                  className={`rounded-lg border p-4 text-sm transition-colors ${
                    method === m.key ? "border-primary bg-primary/10" : "border-border bg-secondary/40"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Placing order…" : "Continue to payment"}
          </Button>
        </form>
      )}

      {step === 2 && (
        <div className="panel mt-6 space-y-5 p-6">
          <h2 className="font-display text-xl font-bold">Pay {price(plan.price)} via {chosen.label}</h2>
          {chosen.kind === "pk" ? (
            <div className="rounded-lg border border-border bg-secondary/40 p-5 text-sm">
              <p>
                <span className="text-muted-foreground">Phone No:</span>{" "}
                <span className="font-display text-lg text-primary">{"phone" in chosen ? chosen.phone : ""}</span>
              </p>
              <p className="mt-2">
                <span className="text-muted-foreground">Name:</span>{" "}
                <span className="font-display text-lg">{"name" in chosen ? chosen.name : ""}</span>
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-secondary/40 p-5 text-center">
              <p className="mb-3 text-sm text-muted-foreground">Scan this Google Pay / UPI QR code</p>
              <img src={UPI_QR} alt="UPI Google Pay QR code" className="mx-auto max-h-80 rounded-lg" />
            </div>
          )}
          <Button className="w-full" onClick={() => setStep(3)}>
            I have paid
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="panel mt-6 space-y-5 p-6">
          <h2 className="font-display text-xl font-bold">Upload payment screenshot</h2>
          <p className="text-sm text-muted-foreground">
            Upload a screenshot of the successful payment so our team can verify it.
          </p>
          <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <Button className="w-full" disabled={!file || busy} onClick={uploadProof}>
            <Upload className="mr-2 size-4" />
            {busy ? "Uploading…" : "Submit proof"}
          </Button>
        </div>
      )}

      {step === 4 && (
        <div className="panel mt-6 space-y-4 p-8 text-center">
          <CheckCircle2 className="mx-auto size-12 text-primary" />
          <h2 className="font-display text-2xl font-bold">Wait for a few minutes</h2>
          <p className="text-sm text-muted-foreground">
            Your payment is being verified by our team. You&apos;ll see the result on your Payments page.
          </p>
          <Button onClick={() => navigate({ to: "/payments" })}>Go to Payments</Button>
        </div>
      )}
    </div>
  );
}
