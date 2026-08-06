import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    return data ?? [];
  });

export const adminGrant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; coins: number; ram: number; disk: number; cpu: number }) =>
    z
      .object({
        userId: z.string().uuid(),
        coins: z.number().int().min(-1000000).max(1000000),
        ram: z.number().int().min(-1000000).max(1000000),
        disk: z.number().int().min(-100000).max(100000),
        cpu: z.number().int().min(-100000).max(100000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: p } = await supabaseAdmin
      .from("profiles")
      .select("coins,ram_mb,disk_gb,cpu_percent")
      .eq("id", data.userId)
      .maybeSingle();
    if (!p) throw new Error("User not found");
    await supabaseAdmin
      .from("profiles")
      .update({
        coins: Math.max(0, p.coins + data.coins),
        ram_mb: Math.max(0, p.ram_mb + data.ram),
        disk_gb: Math.max(0, p.disk_gb + data.disk),
        cpu_percent: Math.max(0, p.cpu_percent + data.cpu),
      })
      .eq("id", data.userId);
    return { ok: true };
  });

export const adminListCodes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("redeem_codes")
      .select("*")
      .order("created_at", { ascending: false });
    return data ?? [];
  });

export const adminCreateCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
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
    }) =>
      z
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
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("redeem_codes").insert({
      code: data.code.toUpperCase(),
      kind: data.kind,
      coins: data.coins,
      ram_mb: data.ram,
      disk_gb: data.disk,
      cpu_percent: data.cpu,
      discount_percent: data.discountPercent,
      discount_inr: data.discountInr,
      uses_per_user: data.usesPerUser,
      max_uses: data.maxUses,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminToggleCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; active: boolean }) =>
    z.object({ id: z.string().uuid(), active: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("redeem_codes").update({ active: data.active }).eq("id", data.id);
    return { ok: true };
  });

export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    return data ?? [];
  });

export const adminDecideOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      orderId: string;
      action: string;
      reason?: string;
      username?: string;
      ip?: string;
      location?: string;
      keyUrl?: string;
    }) =>
      z
        .object({
          orderId: z.string().uuid(),
          action: z.enum(["accept", "reject"]),
          reason: z.string().max(500).optional(),
          username: z.string().max(120).optional(),
          ip: z.string().max(120).optional(),
          location: z.string().max(120).optional(),
          keyUrl: z.string().max(500).optional(),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin.from("orders").select("*").eq("id", data.orderId).maybeSingle();
    if (!order) throw new Error("Order not found");

    if (data.action === "reject") {
      if (!data.reason?.trim()) throw new Error("A rejection reason is required.");
      await supabaseAdmin
        .from("orders")
        .update({ status: "rejected", reject_reason: data.reason.trim() })
        .eq("id", order.id);
      return { ok: true };
    }

    const delivery =
      order.product_type === "vps"
        ? {
            username: data.username ?? "",
            ip: data.ip ?? "",
            location: data.location ?? "",
            keyUrl: data.keyUrl ?? "",
          }
        : order.delivery;

    await supabaseAdmin
      .from("orders")
      .update({ status: "accepted", reject_reason: null, delivery })
      .eq("id", order.id);
    return { ok: true };
  });
