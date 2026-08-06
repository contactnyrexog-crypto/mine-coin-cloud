import { createFileRoute } from "@tanstack/react-router";
import { PlanCard } from "@/components/plan-card";
import { BUDGET_CPU, BUDGET_PLANS, PREMIUM_CPU, PREMIUM_PLANS } from "@/lib/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/minecraft")({
  head: () => ({
    meta: [
      { title: "Minecraft Hosting Plans — NETHOST x MENTION HOST" },
      {
        name: "description",
        content:
          "Budget Minecraft plans on AMD EPYC 7 in Singapore from ₹10/mo, and premium AMD Ryzen 9 9950X plans in India. Grass to Netherite.",
      },
      { property: "og:title", content: "Minecraft Hosting Plans — NETHOST" },
      {
        property: "og:description",
        content: "Grass to Netherite: 2GB to 12GB RAM, NVMe storage, EPYC and Ryzen 9 nodes.",
      },
    ],
  }),
  component: MinecraftPage,
});

function MinecraftPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <h1 className="font-display text-4xl font-bold md:text-5xl">Minecraft Hosting</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Budget nodes run on <strong className="text-foreground">{BUDGET_CPU}</strong> in Singapore. Premium nodes run
        on <strong className="text-foreground">{PREMIUM_CPU}</strong> in India.
      </p>

      <Tabs defaultValue="budget" className="mt-10">
        <TabsList>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="premium">Premium</TabsTrigger>
        </TabsList>

        <TabsContent value="budget" className="mt-8">
          <p className="mb-6 text-sm text-muted-foreground">
            Node: <span className="text-primary">SG - 2 - PAID</span> · {BUDGET_CPU}
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BUDGET_PLANS.map((p) => (
              <PlanCard key={p.key} plan={p} tier="budget" />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="premium" className="mt-8">
          <p className="mb-6 text-sm text-muted-foreground">
            Node: <span className="text-accent">IN - 2 - PAID</span> · {PREMIUM_CPU}
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PREMIUM_PLANS.map((p) => (
              <PlanCard key={p.key} plan={p} tier="premium" />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="panel mt-14 grid gap-6 p-8 md:grid-cols-2">
        <div>
          <h2 className="font-display text-xl font-bold">Pakistan payment methods</h2>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            <li>JazzCash</li>
            <li>EasyPaisa</li>
            <li>Bank Transfer</li>
          </ul>
        </div>
        <div>
          <h2 className="font-display text-xl font-bold">Indian payment methods</h2>
          <p className="mt-3 text-sm text-muted-foreground">UPI / Google Pay — we use exchangers for that.</p>
        </div>
      </div>
    </div>
  );
}
