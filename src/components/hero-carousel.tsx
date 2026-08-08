import { useEffect, useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroVps from "@/assets/hero-vps.jpg";
import heroMinecraft from "@/assets/hero-minecraft.jpg";
import heroFree from "@/assets/hero-free.jpg";

type Slide = {
  image: string;
  badge: string;
  title: string;
  price?: string;
  desc: string;
  to: "/vps" | "/minecraft" | "/free";
};

const SLIDES: Slide[] = [
  {
    image: heroVps,
    badge: "Reliable, always-on infrastructure",
    title: "VPS Hosting",
    price: "₹399",
    desc: "High-memory virtual servers from 8GB to 64GB with root access and fast provisioning.",
    to: "/vps",
  },
  {
    image: heroMinecraft,
    badge: "Built for growing servers, no slot limits",
    title: "Minecraft Server Hosting",
    price: "₹10",
    desc: "Budget plans on AMD EPYC and premium Ryzen 9 9950X nodes in India, Tokyo and Singapore.",
    to: "/minecraft",
  },
  {
    image: heroFree,
    badge: "Earn it — no card required",
    title: "Free Panels & Bot Hosting",
    desc: "Stay AFK, earn 5 coins a minute, buy RAM, disk and CPU, then deploy your own free server.",
    to: "/free",
  },
];

const INTERVAL = 6000;

export function HeroCarousel() {
  const [index, setIndex] = useState(0);

  const go = useCallback((dir: number) => {
    setIndex((i) => (i + dir + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    const t = setInterval(() => go(1), INTERVAL);
    return () => clearInterval(t);
  }, [go, index]);

  return (
    <section className="relative isolate overflow-hidden rounded-2xl border border-border/60">
      <div className="relative h-[560px] w-full">
        {SLIDES.map((s, i) => (
          <img
            key={s.title}
            src={s.image}
            alt={s.title}
            width={1920}
            height={1088}
            loading={i === 0 ? "eager" : "lazy"}
            className={`absolute inset-0 size-full object-cover transition-all duration-1000 ease-out ${
              i === index ? "scale-100 opacity-100" : "scale-105 opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

        <div className="relative flex h-full max-w-7xl flex-col justify-center gap-6 px-6 md:px-14">
          {SLIDES.map((s, i) => (
            <div
              key={s.title}
              className={`absolute max-w-2xl px-6 transition-all duration-700 md:px-14 ${
                i === index ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
              }`}
            >
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-4 py-1.5 text-xs font-medium text-primary">
                <Sparkles className="size-3.5" /> {s.badge}
              </p>
              <h1 className="mt-5 font-display text-5xl font-bold leading-[1.05] md:text-7xl">{s.title}</h1>
              {s.price && (
                <p className="mt-3 text-muted-foreground">
                  Starts at <span className="font-display text-4xl font-bold text-foreground">{s.price}</span> /month
                </p>
              )}
              <p className="mt-4 max-w-xl text-lg text-muted-foreground">{s.desc}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link to={s.to}>Get started</Link>
                </Button>
                <Button size="lg" variant="secondary" asChild>
                  <Link to={s.to}>View plans</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>

        <button
          aria-label="Previous slide"
          onClick={() => go(-1)}
          className="absolute left-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-border/60 bg-background/60 backdrop-blur transition-colors hover:bg-secondary"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          aria-label="Next slide"
          onClick={() => go(1)}
          className="absolute right-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-border/60 bg-background/60 backdrop-blur transition-colors hover:bg-secondary"
        >
          <ChevronRight className="size-5" />
        </button>

        <div className="absolute bottom-6 left-6 flex items-center gap-2 md:left-14">
          {SLIDES.map((s, i) => (
            <button
              key={s.title}
              aria-label={`Go to ${s.title}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-10 bg-primary" : "w-5 bg-muted-foreground/40 hover:bg-muted-foreground"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
