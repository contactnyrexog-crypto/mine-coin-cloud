import { z } from "zod";
import { isAdmin, now, query, requireSession, tx, uid, type Profile, type Order, type RedeemCode } from "@/lib/local-db";

/**
 * Admin tools operate on this browser's local store only.
 *
 * There is no shared server database any more, so an admin sees the accounts
 * and orders created in the browser they are sitting at — not those of
 * customers on their own devices.
 */
function assertAdmin() {
  const s = requireSession();
  if (!isAdmin(s.id)) throw new Error("Forbidden");
  return s;
}

export async function adminListUsers(_?: unknown): Promise<Profile[]> {
  assertAdmin();
  return query((db) =>
    [...db.profiles].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 500),
  );
}

export async function adminGrant({
  data,
}: {
  data: { userId: string; coins: number; ram: number; disk: number; cpu: number };
}) {
  const parsed = z
    .object({
      userId: z.string().min(8).max(64),
      coins: z.number().int().min(-1000000).max(1000000),
      ram: z.number().int().min(-1000000).max(1000000),
      disk: z.number().int().min(-100000).max(100000),
      cpu: z.number().int().min(-100000).max(100000),
    })
    .parse(data);
  assertAdmin();

  tx((db) => {
    const p = db.profiles.find((x) => x.id === parsed.userId);
    if (!p) throw new Error("User not found");
    p.coins = Math.max(0, p.coins + parsed.coins);
    p.ram_mb = Math.max(0, p.ram_mb + parsed.ram);
    p.disk_gb = Math.max(0, p.disk_gb + parsed.disk);
    p.cpu_percent = Math.max(0, p.cpu_percent + parsed.cpu);
    p.updated_at = now();
  });
  return { ok: true };
}

export async function adminListCodes(_?: unknown): Promise<RedeemCode[]> {
  assertAdmin();
  return query((db) =>
    [...db.redeem_codes].sort((a, b) => b.created_at.localeCompare(a.created_at)),
  );
}

export async function adminCreateCode({
  data,
}: {
  data: {
    code: string;
    kind: string;
    coins: number;
    ram: number;
    disk: number;
    cpu: number;
    discountPercent: number;
    discountInr: number;
    usesPerUser: number;
    maxUses: number;
  };
}) {
  const parsed = z
    .object({
      code: z.string().trim().min(2).max(64),
      kind: z.enum(["free", "minecraft"]),
      coins: z.number().int().min(0).max(1000000),
      ram: z.number().int().min(0).max(1000000),
      disk: z.number().int().min(0).max(100000),
      cpu: z.number().int().min(0).max(100000),
      discountPercent: z.number().min(0).max(100),
      discountInr: z.number().min(0).max(1000000),
      usesPerUser: z.number().int().min(1).max(1000),
      maxUses: z.number().int().min(1).max(1000000),
    })
    .parse(data);
  assertAdmin();

  const code = parsed.code.toUpperCase();
  const clash = query((db) => db.redeem_codes.some((c) => c.code === code));
  if (clash) throw new Error("That code already exists.");

  tx((db) => {
    db.redeem_codes.push({
      id: uid(),
      code,
      kind: parsed.kind,
      coins: parsed.coins,
      ram_mb: parsed.ram,
      disk_gb: parsed.disk,
      cpu_percent: parsed.cpu,
      discount_percent: parsed.discountPercent,
      discount_inr: parsed.discountInr,
      uses_per_user: parsed.usesPerUser,
      max_uses: parsed.maxUses,
      used_count: 0,
      active: true,
      created_at: now(),
      updated_at: now(),
    });
  });
  return { ok: true };
}

export async function adminToggleCode({ data }: { data: { id: string; active: boolean } }) {
  const parsed = z.object({ id: z.string().min(8).max(64), active: z.boolean() }).parse(data);
  assertAdmin();
  tx((db) => {
    const c = db.redeem_codes.find((x) => x.id === parsed.id);
    if (c) {
      c.active = parsed.active;
      c.updated_at = now();
    }
  });
  return { ok: true };
}

export async function adminListOrders(_?: unknown): Promise<Order[]> {
  assertAdmin();
  return query((db) =>
    [...db.orders].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 500),
  );
}

export async function adminDecideOrder({
  data,
}: {
  data: {
    orderId: string;
    action: string;
    reason?: string;
    username?: string;
    ip?: string;
    location?: string;
    keyUrl?: string;
  };
}) {
  const parsed = z
    .object({
      orderId: z.string().min(8).max(64),
      action: z.enum(["accept", "reject"]),
      reason: z.string().max(500).optional(),
      username: z.string().max(120).optional(),
      ip: z.string().max(120).optional(),
      location: z.string().max(120).optional(),
      keyUrl: z.string().max(500).optional(),
    })
    .parse(data);
  assertAdmin();

  const order = query((db) => db.orders.find((o) => o.id === parsed.orderId));
  if (!order) throw new Error("Order not found");

  if (parsed.action === "reject") {
    if (!parsed.reason?.trim()) throw new Error("A rejection reason is required.");
    tx((db) => {
      const o = db.orders.find((x) => x.id === order.id);
      if (o) {
        o.status = "rejected";
        o.reject_reason = parsed.reason!.trim();
        o.updated_at = now();
      }
    });
    return { ok: true };
  }

  tx((db) => {
    const o = db.orders.find((x) => x.id === order.id);
    if (!o) return;
    o.status = "accepted";
    o.reject_reason = null;
    o.delivery =
      o.product_type === "vps"
        ? {
            username: parsed.username ?? "",
            ip: parsed.ip ?? "",
            location: parsed.location ?? "",
            keyUrl: parsed.keyUrl ?? "",
          }
        : o.delivery;
    o.updated_at = now();
  });
  return { ok: true };
}
