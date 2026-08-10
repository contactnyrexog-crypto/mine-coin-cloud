import { z } from "zod";
import {
  ensureProfile,
  isAdmin,
  query,
  requireSession,
  tx,
  uid,
  now,
  updateProfile,
  type ServerRow,
} from "@/lib/local-db";

export async function getMyProfile(_?: unknown) {
  const s = requireSession();
  const profile = ensureProfile(s.id, s.email);
  return { profile, isAdmin: isAdmin(s.id) };
}

export async function setCurrencyPref({ data }: { data: { currency: string } }) {
  const { currency } = z.object({ currency: z.enum(["INR", "PKR", "USD"]) }).parse(data);
  const s = requireSession();
  updateProfile(s.id, { currency });
  return { ok: true };
}

export async function saveBilling({ data }: { data: { email: string; address: string } }) {
  const parsed = z
    .object({ email: z.string().email().max(255), address: z.string().max(500) })
    .parse(data);
  const s = requireSession();
  updateProfile(s.id, { billing_email: parsed.email, billing_address: parsed.address });
  return { ok: true };
}

export async function claimAfk(_?: unknown) {
  const s = requireSession();
  const profile = ensureProfile(s.id, s.email);

  const nowMs = Date.now();
  const last = profile.last_afk_credit ? new Date(profile.last_afk_credit).getTime() : nowMs - 60_000;
  const minutes = Math.floor((nowMs - last) / 60_000);
  if (minutes < 1) return { awarded: 0, coins: profile.coins };

  const capped = Math.min(minutes, 10);
  const awarded = capped * 5;
  const coins = profile.coins + awarded;
  updateProfile(s.id, {
    coins,
    last_afk_credit: new Date(last + capped * 60_000).toISOString(),
  });
  return { awarded, coins };
}

export async function startAfk(_?: unknown) {
  const s = requireSession();
  ensureProfile(s.id, s.email);
  updateProfile(s.id, { last_afk_credit: now() });
  return { ok: true };
}

export async function buyShopItem({ data }: { data: { item: string; qty: number } }) {
  const parsed = z
    .object({ item: z.enum(["ram", "disk", "cpu"]), qty: z.number().int().min(1).max(50) })
    .parse(data);
  const s = requireSession();
  const p = ensureProfile(s.id, s.email);

  const prices = { ram: 20, disk: 15, cpu: 50 } as const;
  const cost = prices[parsed.item] * parsed.qty;
  if (p.coins < cost) throw new Error("Not enough coins.");

  updateProfile(s.id, {
    coins: p.coins - cost,
    ram_mb: parsed.item === "ram" ? p.ram_mb + 500 * parsed.qty : p.ram_mb,
    disk_gb: parsed.item === "disk" ? p.disk_gb + parsed.qty : p.disk_gb,
    cpu_percent: parsed.item === "cpu" ? p.cpu_percent + 100 * parsed.qty : p.cpu_percent,
  });
  return { ok: true, spent: cost };
}

export async function claimJoinReward({ data }: { data: { server: string } }) {
  const { server } = z.object({ server: z.enum(["nethost", "mentionhost"]) }).parse(data);
  const s = requireSession();
  const p = ensureProfile(s.id, s.email);

  const already = server === "nethost" ? p.joined_nethost : p.joined_mentionhost;
  if (already) throw new Error("Reward already claimed.");

  updateProfile(s.id, {
    coins: p.coins + 50,
    joined_nethost: server === "nethost" ? true : p.joined_nethost,
    joined_mentionhost: server === "mentionhost" ? true : p.joined_mentionhost,
  });
  return { coins: p.coins + 50 };
}

export async function redeemCode({ data }: { data: { code: string } }) {
  const parsed = z.object({ code: z.string().trim().min(2).max(64) }).parse(data);
  const s = requireSession();
  const p = ensureProfile(s.id, s.email);
  const wanted = parsed.code.toUpperCase();

  const code = query((db) => db.redeem_codes.find((c) => c.code === wanted && c.active));
  if (!code) throw new Error("Invalid or inactive code.");
  if (code.kind !== "free")
    throw new Error("This code is a Minecraft discount coupon — use it at checkout.");
  if (code.used_count >= code.max_uses) throw new Error("This code has reached its usage limit.");

  const used = query(
    (db) => db.redemptions.filter((r) => r.code_id === code.id && r.user_id === s.id).length,
  );
  if (used >= code.uses_per_user)
    throw new Error("You already used this code the maximum number of times.");

  updateProfile(s.id, {
    coins: p.coins + code.coins,
    ram_mb: p.ram_mb + code.ram_mb,
    disk_gb: p.disk_gb + code.disk_gb,
    cpu_percent: p.cpu_percent + code.cpu_percent,
  });
  tx((db) => {
    db.redemptions.push({ id: uid(), code_id: code.id, user_id: s.id, created_at: now() });
    const c = db.redeem_codes.find((x) => x.id === code.id);
    if (c) c.used_count += 1;
  });

  return {
    coins: code.coins,
    ram_mb: code.ram_mb,
    disk_gb: code.disk_gb,
    cpu_percent: code.cpu_percent,
  };
}

export async function listMyServers(_?: unknown): Promise<ServerRow[]> {
  const s = requireSession();
  return query((db) =>
    db.servers
      .filter((x) => x.user_id === s.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
  );
}

export async function createFreeServer({
  data,
}: {
  data: { name: string; egg: string; nodeId: number; ram: number; disk: number; cpu: number };
}) {
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(40),
      egg: z.string().min(2).max(32),
      nodeId: z.number().int(),
      ram: z.number().int().min(128).max(65536),
      disk: z.number().int().min(1).max(500),
      cpu: z.number().int().min(10).max(1000),
    })
    .parse(data);

  const s = requireSession();
  const p = ensureProfile(s.id, s.email);

  const { NODES } = await import("@/lib/constants");
  const node = NODES.find((n) => n.id === parsed.nodeId && n.kind === "free");
  if (!node) throw new Error("Invalid node selection.");

  if (parsed.ram > p.ram_mb || parsed.disk > p.disk_gb || parsed.cpu > p.cpu_percent)
    throw new Error("Not enough resources.");
  if (p.coins < node.coinCost)
    throw new Error(`Not enough coins — ${node.name} costs ${node.coinCost} coins.`);

  const { provisionServer } = await import("@/lib/panel.functions");
  const created = await provisionServer({
    data: {
      email: p.email,
      name: parsed.name,
      eggKey: parsed.egg,
      nodeId: parsed.nodeId,
      ramMb: parsed.ram,
      diskGb: parsed.disk,
      cpuPercent: parsed.cpu,
    },
  });

  updateProfile(s.id, {
    coins: p.coins - node.coinCost,
    ram_mb: p.ram_mb - parsed.ram,
    disk_gb: p.disk_gb - parsed.disk,
    cpu_percent: p.cpu_percent - parsed.cpu,
  });

  tx((db) => {
    db.servers.push({
      id: uid(),
      user_id: s.id,
      name: parsed.name,
      egg: parsed.egg,
      node_id: node.id,
      node_name: node.name,
      ram_mb: parsed.ram,
      disk_gb: parsed.disk,
      cpu_percent: parsed.cpu,
      panel_server_id: created.serverId,
      status: "created",
      created_at: now(),
      updated_at: now(),
    });
  });

  return { ok: true, identifier: created.identifier };
}
