import { createFileRoute, Link } from "@tanstack/react-router";
import { Coins, Gamepad2, Server, ShieldCheck, Zap, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MENTIONHOST_DISCORD, NETHOST_DISCORD } from "@/lib/constants";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NETHOST x MENTION HOST — Free, Minecraft & VPS Hosting" },
      {
        name: "description",
        content:
          "Pick your lane: earn a free Minecraft panel with coins, grab a budget or premium Minecraft server, or deploy a high-memory VPS.",
      },
      { property: "og:title", content: "NETHOST x MENTION HOST — Game & VPS Hosting" },
      {
        property: "og:description",
        content: "Free panels, budget and premium Minecraft hosting on EPYC and Ryzen 9, plus 8–64GB VPS plans.",
      },
    ],
  }),
  component: Home,
});

const CATEGORIES = [
  {
    to: "/free" as const,
    icon: Coins,
    title: "FREE",
    tag: "Earn it",
    desc: "Stay AFK, earn 5 coins a minute, buy RAM, disk and CPU, then deploy your own free server.",
  },
  {
    to: "/minecraft" as const,
    icon: Gamepad2,
    title: "MINECRAFT",
    tag: "Budget & Premium",
    desc: "Grass to Netherite plans from ₹10/mo on AMD EPYC 7, or premium Ryzen 9 9950X nodes in India.",
  },
  {
    to: "/vps" as const,
    icon: Server,
    title: "VPS",
    tag: "8GB – 64GB",
    desc: "High-memory virtual servers with root access, full key-file delivery and fast provisioning.",
  },
];

function Home() {
  return (
    <div>
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-20 text-center">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
          <ShieldCheck className="size-3.5" /> Mention Host is an official partner of NetHost
        </p>
        <h1 className="mx-auto max-w-4xl font-display text-5xl font-bold leading-tight md:text-7xl">
          Hosting that starts <span className="text-primary">free</span> and scales to{" "}
          <span className="text-accent">64GB</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          NetHost x Mention Host runs Minecraft servers, bot panels and VPS across Tokyo, Singapore, India and
          Amsterdam. Choose a category to get started.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild>
            <Link to="/free">Start free</Link>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/minecraft">View Minecraft plans</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 md:grid-cols-3">
        {CATEGORIES.map((c) => (
          <Link key={c.title} to={c.to} className="panel group p-8 transition-all hover:glow">
            <c.icon className="size-9 text-primary" />
            <p className="mt-6 text-xs font-medium uppercase tracking-widest text-accent">{c.tag}</p>
            <h2 className="font-display text-3xl font-bold">{c.title}</h2>
            <p className="mt-3 text-sm text-muted-foreground">{c.desc}</p>
            <span className="mt-6 inline-block text-sm font-medium text-primary group-hover:underline">
              Explore →
            </span>
          </Link>
        ))}
      </section>

      <section className="mx-auto mt-20 grid max-w-7xl gap-6 px-4 md:grid-cols-3">
        {[
          { icon: Zap, t: "Instant deploys", d: "Servers are created on our panel the moment your resources clear." },
          { icon: Globe, t: "7 nodes", d: "Tokyo, Singapore, India and Amsterdam — free and paid locations." },
          { icon: ShieldCheck, t: "Verified payments", d: "JazzCash, EasyPaisa and UPI, reviewed by our team." },
        ].map((f) => (
          <div key={f.t} className="rounded-xl border border-border/60 p-6">
            <f.icon className="size-5 text-accent" />
            <p className="mt-4 font-semibold">{f.t}</p>
            <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto mt-20 max-w-7xl px-4">
        <div className="panel flex flex-col items-center gap-4 p-10 text-center">
          <h2 className="font-display text-2xl font-bold">Join the communities</h2>
          <p className="text-sm text-muted-foreground">Get 50 coins for each Discord you join.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <a href={NETHOST_DISCORD} target="_blank" rel="noreferrer">
                NetHost Discord
              </a>
            </Button>
            <Button variant="secondary" asChild>
              <a href={MENTIONHOST_DISCORD} target="_blank" rel="noreferrer">
                Mention Host Discord
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
