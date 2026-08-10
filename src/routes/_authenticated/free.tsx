import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@/lib/local-fn";
import { getMyProfile } from "@/lib/free.functions";

const TABS = [
  { to: "/free" as const, label: "Overview", exact: true },
  { to: "/free/afk" as const, label: "AFK" },
  { to: "/free/shop" as const, label: "Shop" },
  { to: "/free/create" as const, label: "Create Server" },
  { to: "/free/redeem" as const, label: "Redeem" },
  { to: "/free/join" as const, label: "Join & Earn" },
];

export const Route = createFileRoute("/_authenticated/free")({
  component: FreeLayout,
});

export function useProfile() {
  const fn = useServerFn(getMyProfile);
  return useQuery({ queryKey: ["profile"], queryFn: () => fn({}) });
}

function FreeLayout() {
  const { data } = useProfile();
  const profile = data?.profile;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold">Free Panel</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Earn coins, buy resources and deploy your own free server.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <Stat label="Coins" value={profile?.coins ?? 0} accent />
        <Stat label="RAM" value={`${profile?.ram_mb ?? 0} MB`} />
        <Stat label="Disk" value={`${profile?.disk_gb ?? 0} GB`} />
        <Stat label="CPU" value={`${profile?.cpu_percent ?? 0} %`} />
      </div>

      <nav className="mt-8 flex flex-wrap gap-2 border-b border-border/60 pb-3">
        {TABS.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            activeOptions={{ exact: t.exact ?? false }}
            className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
            activeProps={{ className: "rounded-md px-3 py-2 text-sm bg-primary text-primary-foreground" }}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="panel p-4">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`font-display text-2xl font-bold ${accent ? "text-accent" : "text-foreground"}`}>{value}</p>
    </div>
  );
}
