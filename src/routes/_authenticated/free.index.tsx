import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyServers } from "@/lib/free.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/free/")({
  component: FreeOverview,
});

function FreeOverview() {
  const fn = useServerFn(listMyServers);
  const { data: servers } = useQuery({ queryKey: ["my-servers"], queryFn: () => fn({}) });

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { t: "1. Earn", d: "Sit on the AFK page and collect 5 coins every minute.", to: "/free/afk" as const },
          { t: "2. Upgrade", d: "Spend coins on RAM, disk and CPU in the shop.", to: "/free/shop" as const },
          { t: "3. Deploy", d: "Create your server on a node you can afford.", to: "/free/create" as const },
        ].map((s) => (
          <Link key={s.t} to={s.to} className="panel p-6 hover:border-primary/50">
            <p className="font-display text-lg font-bold text-primary">{s.t}</p>
            <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="font-display text-xl font-bold">Your servers</h2>
        {!servers?.length ? (
          <div className="panel mt-4 flex flex-col items-start gap-3 p-6">
            <p className="text-sm text-muted-foreground">You haven't created a server yet.</p>
            <Button asChild size="sm">
              <Link to="/free/create">Create server</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {servers.map((s) => (
              <div key={s.id} className="panel p-5">
                <p className="font-display text-lg font-bold">{s.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {s.egg} · {s.node_name}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {s.ram_mb} MB RAM · {s.disk_gb} GB Disk · {s.cpu_percent}% CPU
                </p>
                {s.panel_server_id && <p className="mt-2 text-xs text-primary">ID: {s.panel_server_id}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
