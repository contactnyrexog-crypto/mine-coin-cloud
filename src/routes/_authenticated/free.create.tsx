import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@/lib/local-fn";
import { toast } from "sonner";
import { createFreeServer } from "@/lib/free.functions";
import { useProfile } from "./free";
import { EGGS, NODES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/free/create")({
  component: CreateServerPage,
});

function CreateServerPage() {
  const create = useServerFn(createFreeServer);
  const qc = useQueryClient();
  const { data } = useProfile();
  const profile = data?.profile;

  const [name, setName] = useState("");
  const [egg, setEgg] = useState("paper");
  const [nodeId, setNodeId] = useState<number | null>(null);
  const [ram, setRam] = useState(1024);
  const [disk, setDisk] = useState(1);
  const [cpu, setCpu] = useState(50);
  const [busy, setBusy] = useState(false);

  const eggType = EGGS.find((e) => e.key === egg)?.type ?? "minecraft";

  const nodes = useMemo(
    () => NODES.filter((n) => n.kind === "free" && n.supports.includes(eggType)),
    [eggType],
  );

  const selectedNode = nodes.find((n) => n.id === nodeId) ?? null;
  const coins = profile?.coins ?? 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedNode) {
      toast.error("Pick a node.");
      return;
    }
    if (!profile) return;
    if (ram > profile.ram_mb || disk > profile.disk_gb || cpu > profile.cpu_percent) {
      toast.error("Not enough resources.");
      return;
    }
    if (coins < selectedNode.coinCost) {
      toast.error(`Not enough coins — ${selectedNode.name} costs ${selectedNode.coinCost} coins.`);
      return;
    }

    setBusy(true);
    try {
      const res = await create({ data: { name, egg, nodeId: selectedNode.id, ram, disk, cpu } });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["my-servers"] });
      toast.success(`Server created${res?.identifier ? ` (${res.identifier})` : ""}!`);
      setName("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create server");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="panel mx-auto max-w-2xl space-y-6 p-8">
      <div>
        <h2 className="font-display text-2xl font-bold">Create a free server</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Available: {profile?.ram_mb ?? 0} MB RAM · {profile?.disk_gb ?? 0} GB Disk · {profile?.cpu_percent ?? 0}% CPU ·{" "}
          <span className="text-accent">{coins} coins</span>
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sname">Server name</Label>
        <Input id="sname" required minLength={2} maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="egg">Egg / software</Label>
        <select
          id="egg"
          value={egg}
          onChange={(e) => {
            setEgg(e.target.value);
            setNodeId(null);
          }}
          className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
        >
          <optgroup label="Minecraft">
            {EGGS.filter((x) => x.type === "minecraft").map((x) => (
              <option key={x.key} value={x.key}>
                {x.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Bots">
            {EGGS.filter((x) => x.type === "bot").map((x) => (
              <option key={x.key} value={x.key}>
                {x.label}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      <div className="space-y-2">
        <Label>Node</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          {nodes.map((n) => {
            const affordable = coins >= n.coinCost;
            return (
              <button
                type="button"
                key={n.id}
                disabled={!affordable}
                onClick={() => setNodeId(n.id)}
                className={`rounded-lg border p-4 text-left text-sm transition-colors ${
                  nodeId === n.id ? "border-primary bg-primary/10" : "border-border bg-secondary/40"
                } ${affordable ? "hover:border-primary/60" : "cursor-not-allowed opacity-40"}`}
              >
                <p className="font-display font-bold">{n.name}</p>
                <p className="text-xs text-muted-foreground">{n.region}</p>
                <p className="mt-1 text-xs text-accent">
                  {n.coinCost === 0 ? "Free" : `${n.coinCost} coins`}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="ram">RAM (MB)</Label>
          <Input id="ram" type="number" min={128} step={128} value={ram} onChange={(e) => setRam(Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="disk">Disk (GB)</Label>
          <Input id="disk" type="number" min={1} value={disk} onChange={(e) => setDisk(Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cpu">CPU (%)</Label>
          <Input id="cpu" type="number" min={10} step={5} value={cpu} onChange={(e) => setCpu(Number(e.target.value))} />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Creating…" : "Create server"}
      </Button>
    </form>
  );
}
