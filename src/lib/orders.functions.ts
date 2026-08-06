import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      productType: string;
      planKey: string;
      currency: string;
      couponCode?: string;
      billingEmail: string;
      billingAddress: string;
      paymentMethod: string;
      saveBilling: boolean;
    }) =>
      z
        .object({
          productType: z.enum(["minecraft", "vps"]),
          planKey: z.string().min(2).max(64),
          currency: z.enum(["INR", "PKR", "USD"]),
          couponCode: z.string().max(64).optional(),
          billingEmail: z.string().email().max(255),
          billingAddress: z.string().max(500),
          paymentMethod: z.enum(["jazzcash", "easypaisa", "upi"]),
          saveBilling: z.boolean(),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { findPlan, convert, BUDGET_PLANS } = await import("@/lib/constants");
    const plan = findPlan(data.planKey);
    if (!plan) throw new Error("Unknown plan.");

    let discount = 0;
    let couponCode: string | null = null;
    if (data.couponCode?.trim()) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: code } = await supabaseAdmin
        .from("redeem_codes")
        .select("*")
        .eq("code", data.couponCode.trim().toUpperCase())
        .eq("kind", "minecraft")
        .eq("active", true)
        .maybeSingle();
      if (!code) throw new Error("Invalid coupon code.");
      if (code.used_count >= code.max_uses) throw new Error("Coupon usage limit reached.");
      const { count } = await supabaseAdmin
        .from("redemptions")
        .select("id", { count: "exact", head: true })
        .eq("code_id", code.id)
        .eq("user_id", userId);
      if ((count ?? 0) >= code.uses_per_user) throw new Error("You already used this coupon.");
      discount = Number(code.discount_inr) + (plan.price * Number(code.discount_percent)) / 100;
      discount = Math.min(discount, plan.price);
      couponCode = code.code;
      await supabaseAdmin.from("redemptions").insert({ code_id: code.id, user_id: userId });
      await supabaseAdmin.from("redeem_codes").update({ used_count: code.used_count + 1 }).eq("id", code.id);
    }

    const finalInr = Math.max(0, plan.price - discount);
    const tier =
      data.productType === "minecraft"
        ? BUDGET_PLANS.some((p) => p.key === plan.key)
          ? "budget"
          : "premium"
        : null;

    if (data.saveBilling) {
      await supabase
        .from("profiles")
        .update({ billing_email: data.billingEmail, billing_address: data.billingAddress })
        .eq("id", userId);
    }

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        product_type: data.productType,
        plan_key: plan.key,
        plan_name: plan.name,
        plan_tier: tier,
        price_inr: plan.price,
        currency: data.currency,
        amount: convert(finalInr, data.currency as "INR" | "PKR" | "USD"),
        discount,
        coupon_code: couponCode,
        payment_method: data.paymentMethod,
        billing_email: data.billingEmail,
        billing_address: data.billingAddress,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return order;
  });

export const submitPaymentProof = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string; path: string; origin: string }) =>
    z
      .object({ orderId: z.string().uuid(), path: z.string().min(3).max(300), origin: z.string().url().max(300) })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("id", data.orderId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!order) throw new Error("Order not found.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed } = await supabaseAdmin.storage
      .from("payment-proofs")
      .createSignedUrl(data.path, 60 * 60 * 24 * 365);

    const paidAt = new Date().toISOString();
    await supabase
      .from("orders")
      .update({ proof_url: signed?.signedUrl ?? null, paid_at: paidAt, status: "pending" })
      .eq("id", order.id);

    const { CURRENCIES } = await import("@/lib/constants");
    const { sendPaymentWebhook } = await import("@/lib/discord.server");
    await sendPaymentWebhook({
      orderId: order.id,
      paymentType: order.payment_method.toUpperCase(),
      planLabel: `${order.plan_name}${order.plan_tier ? ` (${order.plan_tier})` : ""}`,
      productType: order.product_type,
      amount: `${CURRENCIES[order.currency as "INR"].symbol}${order.amount}`,
      paidAt: new Date(paidAt).toUTCString(),
      proofUrl: signed?.signedUrl ?? null,
      buyerEmail: order.billing_email,
      adminUrl: `${data.origin.replace(/\/$/, "")}/admin/payments`,
    });

    return { ok: true };
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("orders")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    return data ?? [];
  });

export const provisionMinecraftOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: { orderId: string; mode: string; email: string; password?: string; serverName: string; egg: string }) =>
      z
        .object({
          orderId: z.string().uuid(),
          mode: z.enum(["new", "existing"]),
          email: z.string().email().max(255),
          password: z.string().min(8).max(72).optional(),
          serverName: z.string().trim().min(2).max(40),
          egg: z.string().min(2).max(32),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("id", data.orderId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!order) throw new Error("Order not found.");
    if (order.status !== "accepted") throw new Error("This payment has not been accepted yet.");
    if (order.product_type !== "minecraft") throw new Error("Only Minecraft orders are provisioned here.");
    if ((order.delivery as { serverId?: string } | null)?.serverId) throw new Error("Server already created.");

    const { BUDGET_PLANS, PREMIUM_PLANS, BUDGET_NODE_ID, PREMIUM_NODE_ID, NODES } = await import(
      "@/lib/constants"
    );
    const plan = [...BUDGET_PLANS, ...PREMIUM_PLANS].find((p) => p.key === order.plan_key);
    if (!plan) throw new Error("Plan not found.");
    const nodeId = order.plan_tier === "premium" ? PREMIUM_NODE_ID : BUDGET_NODE_ID;
    const node = NODES.find((n) => n.id === nodeId)!;
    const cpuPercent = Math.round(parseFloat(plan.cores) * 100);

    const { createPanelServer } = await import("@/lib/pterodactyl.server");
    const created = await createPanelServer({
      email: data.email,
      ...(data.mode === "new" && data.password ? { password: data.password } : {}),
      name: data.serverName,
      eggKey: data.egg,
      nodeId,
      ramMb: plan.ram * 1024,
      diskGb: plan.disk,
      cpuPercent,
    });

    await supabase
      .from("orders")
      .update({
        delivery: {
          ...(order.delivery as Record<string, unknown> | null),
          serverId: created.serverId,
          identifier: created.identifier,
          node: node.name,
          panelEmail: data.email,
        },
        status: "delivered",
      })
      .eq("id", order.id);

    return { identifier: created.identifier, node: node.name };
  });
