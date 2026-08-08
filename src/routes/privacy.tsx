import { createFileRoute } from "@tanstack/react-router";
import { BRAND } from "@/lib/constants";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — NETHOST" },
      { name: "description", content: "How NETHOST collects, stores and uses your data." },
      { property: "og:title", content: "Privacy Policy — NETHOST" },
      { property: "og:description", content: "Data we store, why we store it, and how to have it removed." },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-4xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">How {BRAND} handles your data.</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">Data we collect</h2>
          <p>
            Account email, billing email and billing address, order history, coin and resource balances, servers you
            create, and payment screenshots you upload.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">Why we collect it</h2>
          <p>
            To provision servers on our game panel, verify manual payments, prevent abuse of the free tier, and provide
            support.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">Payment proofs</h2>
          <p>
            Screenshots are stored in a private bucket. A time-limited link is shared with our payment review team over
            Discord solely to verify your transaction.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">Sharing</h2>
          <p>
            We share only what is required with our infrastructure partner NetHost to deliver your service. We never
            sell personal data.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">Retention & removal</h2>
          <p>
            Order records are kept for accounting. You can request deletion of your account and payment proofs by
            contacting us in our Discord.
          </p>
        </section>
      </div>
    </article>
  );
}
