import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error) throw new Error(error.message);
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    return { profile: data, isAdmin: (roles ?? []).some((r) => r.role === "admin") };
  });

export const setCurrencyPref = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { currency: string }) => z.object({ currency: z.enum(["INR", "PKR", "USD"]) }).parse(d))
  .handler(async ({ data, context }) => {
    await context.supabase.from("profiles").update({ currency: data.currency }).eq("id", context.userId);
    return { ok: true };
  });

export const saveBilling = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string; address: string }) =>
    z.object({ email: z.string().email().max(255), address: z.string().max(500) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ billing_email: data.email, billing_address: data.address })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const claimAfk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("coins,last_afk_credit")
      .eq("id", userId)
      .maybeSingle();
    if (error || !profile) throw new Error(error?.message ?? "Profile not found");

    const now = Date.now();
    const last = profile.last_afk_credit ? new Date(profile.last_afk_credit).getTime() : now - 60_000;
    const minutes = Math.floor((now - last) / 60_000);
    if (minutes < 1) return { awarded: 0, coins: profile.coins };

    const capped = Math.min(minutes, 10);
    const awarded = capped * 5;
    const coins = profile.coins + awarded;
    const { error: upErr } = await supabase
      .from("profiles")
      .update({ coins, last_afk_credit: new Date(last + capped * 60_000).toISOString() })
      .eq("id", userId);
    if (upErr) throw new Error(upErr.message);
    return { awarded, coins };
  });

export const startAfk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase
      .from("profiles")
      .update({ last_afk_credit: new Date().toISOString() })
      .eq("id", context.userId);
    return { ok: true };
  });

export const buyShopItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { item: string; qty: number }) =>
    z.object({ item: z.enum(["ram", "disk", "cpu"]), qty: z.number().int().min(1).max(50) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const prices = { ram: 20, disk: 15, cpu: 50 } as const;
    const cost = prices[data.item] * data.qty;
    const { data: p, error } = await supabase
      .from("profiles")
      .select("coins,ram_mb,disk_gb,cpu_percent")
      .eq("id", userId)
      .maybeSingle();
    if (error || !p) throw new Error(error?.message ?? "Profile not found");
    if (p.coins < cost) throw new Error("Not enough coins.");

    const { error: upErr } = await supabase
      .from("profiles")
      .update({
        coins: p.coins - cost,
        ram_mb: data.item === "ram" ? p.ram_mb + 500 * data.qty : p.ram_mb,
        disk_gb: data.item === "disk" ? p.disk_gb + data.qty : p.disk_gb,
        cpu_percent: data.item === "cpu" ? p.cpu_percent + 100 * data.qty : p.cpu_percent,
      })
      .eq("id", userId);
    if (upErr) throw new Error(upErr.message);
    return { ok: true, spent: cost };
  });

export const claimJoinReward = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { server: string }) =>
    z.object({ server: z.enum(["nethost", "mentionhost"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const col = data.server === "nethost" ? "joined_nethost" : "joined_mentionhost";
    const { data: p, error } = await supabase
      .from("profiles")
      .select("coins,joined_nethost,joined_mentionhost")
      .eq("id", userId)
      .maybeSingle();
    if (error || !p) throw new Error(error?.message ?? "Profile not found");
    const already = data.server === "nethost" ? p.joined_nethost : p.joined_mentionhost;
    if (already) throw new Error("Reward already claimed.");
    const { error: upErr } = await supabase
      .from("profiles")
      .update({
        coins: p.coins + 50,
        joined_nethost: data.server === "nethost" ? true : p.joined_nethost,
        joined_mentionhost: data.server === "mentionhost" ? true : p.joined_mentionhost,
      })
      .eq("id", userId);
    if (upErr) throw new Error(upErr.message);
    return { coins: p.coins + 50 };
  });

export const redeemCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { code: string }) => z.object({ code: z.string().trim().min(2).max(64) }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: code } = await supabaseAdmin
      .from("redeem_codes")
      .select("*")
      .eq("code", data.code.toUpperCase())
      .eq("active", true)
      .maybeSingle();
    if (!code) throw new Error("Invalid or inactive code.");
    if (code.kind !== "free") throw new Error("This code is a Minecraft discount coupon — use it at checkout.");
    if (code.used_count >= code.max_uses) throw new Error("This code has reached its usage limit.");

    const { count } = await supabaseAdmin
      .from("redemptions")
      .select("id", { count: "exact", head: true })
      .eq("code_id", code.id)
      .eq("user_id", userId);
    if ((count ?? 0) >= code.uses_per_user) throw new Error("You already used this code the maximum number of times.");

    const { data: p } = await supabaseAdmin
      .from("profiles")
      .select("coins,ram_mb,disk_gb,cpu_percent")
      .eq("id", userId)
      .maybeSingle();
    if (!p) throw new Error("Profile not found");

    await supabaseAdmin
      .from("profiles")
      .update({
        coins: p.coins + code.coins,
        ram_mb: p.ram_mb + code.ram_mb,
        disk_gb: p.disk_gb + code.disk_gb,
        cpu_percent: p.cpu_percent + code.cpu_percent,
      })
      .eq("id", userId);
    await supabaseAdmin.from("redemptions").insert({ code_id: code.id, user_id: userId });
    await supabaseAdmin.from("redeem_codes").update({ used_count: code.used_count + 1 }).eq("id", code.id);

    return { coins: code.coins, ram_mb: code.ram_mb, disk_gb: code.disk_gb, cpu_percent: code.cpu_percent };
  });

export const listMyServers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("servers")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    return data ?? [];
  });

export const createFreeServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { name: string; egg: string; nodeId: number; ram: number; disk: number; cpu: number }) =>
    z
      .object({
        name: z.string().trim().min(2).max(40),
        egg: z.string().min(2).max(32),
        nodeId: z.number().int(),
        ram: z.number().int().min(128).max(65536),
        disk: z.number().int().min(1).max(500),
        cpu: z.number().int().min(10).max(1000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    const { NODES } = await import("@/lib/constants");
    const node = NODES.find((n) => n.id === data.nodeId && n.kind === "free");
    if (!node) throw new Error("Invalid node selection.");

    const { data: p } = await supabase
      .from("profiles")
      .select("coins,ram_mb,disk_gb,cpu_percent,email")
      .eq("id", userId)
      .maybeSingle();
    if (!p) throw new Error("Profile not found");
    if (data.ram > p.ram_mb || data.disk > p.disk_gb || data.cpu > p.cpu_percent)
      throw new Error("Not enough resources.");
    if (p.coins < node.coinCost) throw new Error(`Not enough coins — ${node.name} costs ${node.coinCost} coins.`);

    const email = (p.email ?? (claims as { email?: string }).email) as string;
    const { createPanelServer } = await import("@/lib/pterodactyl.server");
    const created = await createPanelServer({
      email,
      name: data.name,
      eggKey: data.egg,
      nodeId: data.nodeId,
      ramMb: data.ram,
      diskGb: data.disk,
      cpuPercent: data.cpu,
    });

    await supabase.from("profiles").update({
      coins: p.coins - node.coinCost,
      ram_mb: p.ram_mb - data.ram,
      disk_gb: p.disk_gb - data.disk,
      cpu_percent: p.cpu_percent - data.cpu,
    }).eq("id", userId);

    await supabase.from("servers").insert({
      user_id: userId,
      name: data.name,
      egg: data.egg,
      node_id: node.id,
      node_name: node.name,
      ram_mb: data.ram,
      disk_gb: data.disk,
      cpu_percent: data.cpu,
      panel_server_id: created.serverId,
    });

    return { ok: true, identifier: created.identifier };
  });
