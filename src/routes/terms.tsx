import { createFileRoute } from "@tanstack/react-router";
import { BRAND } from "@/lib/constants";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — NETHOST" },
      { name: "description", content: "Terms of service for NETHOST hosting, free panels and VPS." },
      { property: "og:title", content: "Terms of Service — NETHOST" },
      { property: "og:description", content: "Rules covering usage, payments, refunds and suspension." },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-4xl font-bold">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Applies to all {BRAND} services.</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">1. Accounts</h2>
          <p>
            You are responsible for keeping your credentials secure and for all activity on your account. One person
            may not create multiple free accounts to farm coins or resources.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">2. Free panel</h2>
          <p>
            Coins earned through AFK, joins and redeem codes have no cash value and cannot be transferred or refunded.
            Automating the AFK page, using scripts or abusing the shop results in resource removal and suspension.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">3. Payments</h2>
          <p>
            Payments made by JazzCash, EasyPaisa or UPI are manually verified. Uploading a fake or edited payment proof
            is fraud and results in a permanent ban. Prices are billed monthly in the currency shown at checkout.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">4. Refunds</h2>
          <p>
            Refunds may be issued within 24 hours of delivery if the service cannot be provisioned. No refunds are
            offered after a server has been used or for a rejected/incorrect payment proof.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">5. Acceptable use</h2>
          <p>
            No DDoS tooling, crypto mining, phishing, mass mailing, nulled software, or content illegal in the node's
            country. We may suspend any service that endangers node stability.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">6. Availability</h2>
          <p>
            Free services are provided as-is with no uptime guarantee. Paid nodes target high availability but
            maintenance windows may apply.
          </p>
        </section>
      </div>
    </article>
  );
}
