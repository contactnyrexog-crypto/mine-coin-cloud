import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@/lib/local-fn";
import { toast } from "sonner";
import { adminListUsers, adminGrant } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const listFn = useServerFn(adminListUsers);
  const grantFn = useServerFn(adminGrant);
  const qc = useQueryClient();
  const { data: users } = useQuery({ queryKey: ["admin-users"], queryFn: () => listFn({}) });
  const [q, setQ] = useState("");
  const [form, setForm] = useState<Record<string, { coins: number; ram: number; disk: number; cpu: number }>>({});
  const [busy, setBusy] = useState("");

  const shown = (users ?? []).filter((u: any) => !q || (u.email ?? "").toLowerCase().includes(q.toLowerCase()));

  function val(id: string) {
    return form[id] ?? { coins: 0, ram: 0, disk: 0, cpu: 0 };
  }

  async function grant(id: string) {
    setBusy(id);
    try {
      await grantFn({ data: { userId: id, ...val(id) } });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setForm({ ...form, [id]: { coins: 0, ram: 0, disk: 0, cpu: 0 } });
      toast.success("Updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="space-y-4">
      <Input placeholder="Search by email…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
      {shown.map((u: any) => (
        <div key={u.id} className="panel space-y-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-display font-bold">{u.email ?? u.id}</p>
            <p className="text-xs text-muted-foreground">
              {u.coins} coins · {u.ram_mb} MB RAM · {u.disk_gb} GB Disk · {u.cpu_percent}% CPU
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-5">
            {(["coins", "ram", "disk", "cpu"] as const).map((k) => (
              <Input
                key={k}
                type="number"
                placeholder={k === "ram" ? "+RAM MB" : k === "disk" ? "+Disk GB" : k === "cpu" ? "+CPU %" : "+Coins"}
                value={val(u.id)[k]}
                onChange={(e) => setForm({ ...form, [u.id]: { ...val(u.id), [k]: Number(e.target.value) } })}
              />
            ))}
            <Button disabled={busy === u.id} onClick={() => grant(u.id)}>
              {busy === u.id ? "Saving…" : "Apply"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
