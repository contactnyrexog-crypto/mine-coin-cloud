import { z } from "zod";
import {
  ensureProfile,
  loadProof,
  now,
  query,
  requireSession,
  saveProof,
  tx,
  uid,
  updateProfile,
  type Order,
} from "@/lib/local-db";

export async function createOrder({
  data,
}: {
  data: {
    productType: string;
    planKey: string;
    currency: string;
    couponCode?: string;
    billingEmail: string;
    billingAddress: string;
    paymentMethod: string;
    saveBilling: boolean;
  };
}) {
  const parsed = z
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
    .parse(data);

  const s = requireSession();
  ensureProfile(s.id, s.email);

  const { findPlan, convert, BUDGET_PLANS } = await import("@/lib/constants");
  const plan = findPlan(parsed.planKey);
  if (!plan) throw new Error("Unknown plan.");

  let discount = 0;
  let couponCode: string | null = null;

  if (parsed.couponCode?.trim()) {
    const wanted = parsed.couponCode.trim().toUpperCase();
    const code = query((db) =>
      db.redeem_codes.find((c) => c.code === wanted && c.kind === "minecraft" && c.active),
    );
    if (!code) throw new Error("Invalid coupon code.");
    if (code.used_count >= code.max_uses) throw new Error("Coupon usage limit reached.");

    const used = query(
      (db) => db.redemptions.filter((r) => r.code_id === code.id && r.user_id === s.id).length,
    );
    if (used >= code.uses_per_user) throw new Error("You already used this coupon.");

    discount = Number(code.discount_inr) + (plan.price * Number(code.discount_percent)) / 100;
    discount = Math.min(discount, plan.price);
    couponCode = code.code;

    tx((db) => {
      db.redemptions.push({ id: uid(), code_id: code.id, user_id: s.id, created_at: now() });
      const c = db.redeem_codes.find((x) => x.id === code.id);
      if (c) c.used_count += 1;
    });
  }

  const finalInr = Math.max(0, plan.price - discount);
  const tier =
    parsed.productType === "minecraft"
      ? BUDGET_PLANS.some((p) => p.key === plan.key)
        ? "budget"
        : "premium"
      : null;

  if (parsed.saveBilling) {
    updateProfile(s.id, {
      billing_email: parsed.billingEmail,
      billing_address: parsed.billingAddress,
    });
  }

  const order: Order = {
    id: uid(),
    user_id: s.id,
    product_type: parsed.productType,
    plan_key: plan.key,
    plan_name: plan.name,
    plan_tier: tier,
    price_inr: plan.price,
    currency: parsed.currency,
    amount: convert(finalInr, parsed.currency as "INR" | "PKR" | "USD"),
    discount,
    coupon_code: couponCode,
    payment_method: parsed.paymentMethod,
    billing_email: parsed.billingEmail,
    billing_address: parsed.billingAddress,
    proof_url: null,
    status: "pending",
    reject_reason: null,
    delivery: null,
    paid_at: null,
    created_at: now(),
    updated_at: now(),
  };

  tx((db) => {
    db.orders.push(order);
  });
  return order;
}

export async function submitPaymentProof({
  data,
}: {
  data: { orderId: string; proofDataUrl: string; origin: string };
}) {
  const parsed = z
    .object({
      orderId: z.string().min(8).max(64),
      proofDataUrl: z.string().min(16),
      origin: z.string().max(300),
    })
    .parse(data);

  const s = requireSession();
  const order = query((db) => db.orders.find((o) => o.id === parsed.orderId && o.user_id === s.id));
  if (!order) throw new Error("Order not found.");

  saveProof(order.id, parsed.proofDataUrl);

  const paidAt = now();
  tx((db) => {
    const o = db.orders.find((x) => x.id === order.id);
    if (o) {
      o.proof_url = "local";
      o.paid_at = paidAt;
      o.status = "pending";
      o.updated_at = paidAt;
    }
  });

  // Best-effort Discord ping; a webhook failure must not lose the payment.
  try {
    const { CURRENCIES } = await import("@/lib/constants");
    const { notifyPayment } = await import("@/lib/panel.functions");
    await notifyPayment({
      data: {
        orderId: order.id,
        paymentType: order.payment_method.toUpperCase(),
        planLabel: `${order.plan_name}${order.plan_tier ? ` (${order.plan_tier})` : ""}`,
        productType: order.product_type,
        amount: `${CURRENCIES[order.currency as "INR"].symbol}${order.amount}`,
        paidAt: new Date(paidAt).toUTCString(),
        buyerEmail: order.billing_email,
        adminUrl: `${parsed.origin.replace(/\/$/, "")}/admin/payments`,
      },
    });
  } catch (err) {
    console.error("Discord notification failed", err);
  }

  return { ok: true };
}

export async function listMyOrders(_?: unknown): Promise<Order[]> {
  const s = requireSession();
  return query((db) =>
    db.orders
      .filter((o) => o.user_id === s.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
  );
}

export function getProofImage(orderId: string) {
  return loadProof(orderId);
}

export async function provisionMinecraftOrder({
  data,
}: {
  data: {
    orderId: string;
    mode: string;
    email: string;
    password?: string;
    serverName: string;
    egg: string;
  };
}) {
  const parsed = z
    .object({
      orderId: z.string().min(8).max(64),
      mode: z.enum(["new", "existing"]),
      email: z.string().email().max(255),
      password: z.string().min(8).max(72).optional(),
      serverName: z.string().trim().min(2).max(40),
      egg: z.string().min(2).max(32),
    })
    .parse(data);

  const s = requireSession();
  const order = query((db) => db.orders.find((o) => o.id === parsed.orderId && o.user_id === s.id));
  if (!order) throw new Error("Order not found.");
  if (order.status !== "accepted") throw new Error("This payment has not been accepted yet.");
  if (order.product_type !== "minecraft")
    throw new Error("Only Minecraft orders are provisioned here.");
  if ((order.delivery as { serverId?: string } | null)?.serverId)
    throw new Error("Server already created.");

  const { BUDGET_PLANS, PREMIUM_PLANS, BUDGET_NODE_ID, PREMIUM_NODE_ID, NODES } = await import(
    "@/lib/constants"
  );
  const plan = [...BUDGET_PLANS, ...PREMIUM_PLANS].find((p) => p.key === order.plan_key);
  if (!plan) throw new Error("Plan not found.");
  const nodeId = order.plan_tier === "premium" ? PREMIUM_NODE_ID : BUDGET_NODE_ID;
  const node = NODES.find((n) => n.id === nodeId)!;
  const cpuPercent = Math.round(parseFloat(plan.cores) * 100);

  const { provisionServer } = await import("@/lib/panel.functions");
  const created = await provisionServer({
    data: {
      email: parsed.email,
      ...(parsed.mode === "new" && parsed.password ? { password: parsed.password } : {}),
      name: parsed.serverName,
      eggKey: parsed.egg,
      nodeId,
      ramMb: plan.ram * 1024,
      diskGb: plan.disk,
      cpuPercent,
    },
  });

  tx((db) => {
    const o = db.orders.find((x) => x.id === order.id);
    if (o) {
      o.delivery = {
        ...(o.delivery as Record<string, unknown> | null),
        serverId: created.serverId,
        identifier: created.identifier,
        node: node.name,
        panelEmail: parsed.email,
      };
      o.status = "delivered";
      o.updated_at = now();
    }
  });

  return { identifier: created.identifier, node: node.name };
}
