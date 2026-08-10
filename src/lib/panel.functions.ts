import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Server-side bridge to the Pterodactyl panel and the Discord webhook.
 *
 * These stay on the server because the panel API key and webhook URL must not
 * reach the browser. They are the only remaining server functions — everything
 * else is local to the browser now.
 *
 * NOTE: with no session store on the server these endpoints are unauthenticated,
 * so anything reachable here is reachable by anyone who can call the endpoint.
 */

export const provisionServer = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      email: string;
      password?: string;
      name: string;
      eggKey: string;
      nodeId: number;
      ramMb: number;
      diskGb: number;
      cpuPercent: number;
    }) =>
      z
        .object({
          email: z.string().email().max(255),
          password: z.string().min(8).max(72).optional(),
          name: z.string().trim().min(2).max(40),
          eggKey: z.string().min(2).max(32),
          nodeId: z.number().int(),
          ramMb: z.number().int().min(128).max(131072),
          diskGb: z.number().int().min(1).max(2000),
          cpuPercent: z.number().int().min(10).max(3200),
        })
        .parse(d),
  )
  .handler(async ({ data }) => {
    const { createPanelServer } = await import("@/lib/pterodactyl.server");
    const created = await createPanelServer({
      email: data.email,
      ...(data.password ? { password: data.password } : {}),
      name: data.name,
      eggKey: data.eggKey,
      nodeId: data.nodeId,
      ramMb: data.ramMb,
      diskGb: data.diskGb,
      cpuPercent: data.cpuPercent,
    });
    return { serverId: created.serverId, identifier: created.identifier };
  });

export const notifyPayment = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      orderId: string;
      paymentType: string;
      planLabel: string;
      productType: string;
      amount: string;
      paidAt: string;
      buyerEmail: string;
      adminUrl: string;
    }) =>
      z
        .object({
          orderId: z.string().max(64),
          paymentType: z.string().max(32),
          planLabel: z.string().max(200),
          productType: z.string().max(32),
          amount: z.string().max(64),
          paidAt: z.string().max(64),
          buyerEmail: z.string().max(255),
          adminUrl: z.string().max(300),
        })
        .parse(d),
  )
  .handler(async ({ data }) => {
    const { sendPaymentWebhook } = await import("@/lib/discord.server");
    await sendPaymentWebhook({
      orderId: data.orderId,
      paymentType: data.paymentType,
      planLabel: data.planLabel,
      productType: data.productType,
      amount: data.amount,
      paidAt: data.paidAt,
      // Proof images live in the buyer's browser and have no shareable URL.
      proofUrl: null,
      buyerEmail: data.buyerEmail,
      adminUrl: data.adminUrl,
    });
    return { ok: true };
  });
