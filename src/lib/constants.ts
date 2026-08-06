export const BRAND = "NETHOST x MENTION HOST";
export const NETHOST_DISCORD = "https://discord.gg/6rrVav8HhH";
export const MENTIONHOST_DISCORD = "https://discord.gg/wFZa6HKNQH";

export const CURRENCIES = {
  INR: { code: "INR", symbol: "₹", rate: 1 },
  PKR: { code: "PKR", symbol: "Rs ", rate: 3.3 },
  USD: { code: "USD", symbol: "$", rate: 0.012 },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export function convert(inr: number, code: CurrencyCode) {
  const { rate } = CURRENCIES[code];
  const v = inr * rate;
  return code === "USD" ? Math.round(v * 100) / 100 : Math.round(v);
}

export function formatPrice(inr: number, code: CurrencyCode) {
  return `${CURRENCIES[code].symbol}${convert(inr, code).toLocaleString()}`;
}

/* ---------------- Free panel ---------------- */

export const AFK_COINS_PER_MINUTE = 5;

export const SHOP_ITEMS = [
  { key: "ram", label: "500 MB RAM", price: 20, amount: 500, unit: "MB RAM" },
  { key: "disk", label: "1 GB DISK", price: 15, amount: 1, unit: "GB Disk" },
  { key: "cpu", label: "1v Core CPU", price: 50, amount: 100, unit: "% CPU" },
] as const;

export const JOIN_REWARDS = [
  { key: "nethost", label: "Join NetHost", coins: 50, url: NETHOST_DISCORD },
  { key: "mentionhost", label: "Join Mention Host", coins: 50, url: MENTIONHOST_DISCORD },
] as const;

export const DEFAULT_RESOURCES = { ram_mb: 2048, disk_gb: 1, cpu_percent: 75 };

/* ---------------- Nodes ---------------- */

export type NodeDef = {
  id: number;
  name: string;
  region: string;
  coinCost: number;
  kind: "free" | "paid";
  supports: ("minecraft" | "bot")[];
};

export const NODES: NodeDef[] = [
  { id: 11, name: "Tokyo - 1 - FREE", region: "Tokyo, Japan", coinCost: 0, kind: "free", supports: ["minecraft"] },
  { id: 7, name: "AM - 01 - BOT - FREE", region: "Amsterdam, NL", coinCost: 0, kind: "free", supports: ["bot"] },
  { id: 3, name: "SG - 1 - FREE", region: "Singapore", coinCost: 15, kind: "free", supports: ["minecraft"] },
  { id: 9, name: "IN - 1 - FREE", region: "India", coinCost: 20, kind: "free", supports: ["minecraft"] },
  { id: 6, name: "SG - 2 - PAID", region: "Singapore", coinCost: 0, kind: "paid", supports: ["minecraft"] },
  { id: 5, name: "AM - 01 - BOT - PAID", region: "Amsterdam, NL", coinCost: 0, kind: "paid", supports: ["bot"] },
  { id: 10, name: "IN - 2 - PAID", region: "India", coinCost: 0, kind: "paid", supports: ["minecraft"] },
];

export const BUDGET_NODE_ID = 6; // SG - 2 - PAID
export const PREMIUM_NODE_ID = 10; // IN - 2 - PAID

/* ---------------- Eggs ---------------- */

export type EggDef = { key: string; label: string; type: "minecraft" | "bot" };

export const EGGS: EggDef[] = [
  { key: "paper", label: "Paper (Minecraft)", type: "minecraft" },
  { key: "purpur", label: "Purpur (Minecraft)", type: "minecraft" },
  { key: "forge", label: "Forge (Minecraft)", type: "minecraft" },
  { key: "fabric", label: "Fabric (Minecraft)", type: "minecraft" },
  { key: "vanilla", label: "Vanilla (Minecraft)", type: "minecraft" },
  { key: "bungeecord", label: "BungeeCord (Minecraft)", type: "minecraft" },
  { key: "python", label: "Python Generic", type: "bot" },
  { key: "nodejs", label: "Node.js Generic", type: "bot" },
];

/* ---------------- Minecraft plans ---------------- */

export type McPlan = {
  key: string;
  name: string;
  ram: number;
  cores: string;
  disk: number;
  price: number;
  icon: string;
};

const planShape = (
  key: string,
  name: string,
  icon: string,
  ram: number,
  cores: string,
  disk: number,
  price: number,
): McPlan => ({ key, name, icon, ram, cores, disk, price });

export const BUDGET_PLANS: McPlan[] = [
  planShape("budget-grass", "GRASS PLAN", "🌱", 2, "1v Core", 5, 10),
  planShape("budget-stone", "STONE PLAN", "🪨", 4, "2v Core", 5, 20),
  planShape("budget-iron", "IRON PLAN", "⚙️", 6, "2.5v Core", 8, 25),
  planShape("budget-gold", "GOLD PLAN", "🥇", 8, "4v Core", 10, 30),
  planShape("budget-diamond", "DIAMOND PLAN", "💎", 10, "6v Core", 15, 40),
  planShape("budget-netherite", "NETHERITE PLAN", "🛡️", 12, "8v Core", 20, 50),
];

export const PREMIUM_PLANS: McPlan[] = [
  planShape("premium-grass", "GRASS PLAN", "🌱", 2, "1v Core", 5, 20),
  planShape("premium-stone", "STONE PLAN", "🪨", 4, "2v Core", 5, 25),
  planShape("premium-iron", "IRON PLAN", "⚙️", 6, "2.5v Core", 8, 35),
  planShape("premium-gold", "GOLD PLAN", "🥇", 8, "4v Core", 10, 40),
  planShape("premium-diamond", "DIAMOND PLAN", "💎", 10, "6v Core", 15, 50),
  planShape("premium-netherite", "NETHERITE PLAN", "🛡️", 12, "8v Core", 20, 60),
];

export const BUDGET_CPU = "AMD EPYC 7-series";
export const PREMIUM_CPU = "AMD Ryzen 9 9950X";

/* ---------------- VPS plans ---------------- */

export type VpsPlan = { key: string; name: string; ram: number; price: number };

export const VPS_PLANS: VpsPlan[] = [
  { key: "vps-8", name: "8GB RAM VPS", ram: 8, price: 100 },
  { key: "vps-16", name: "16GB RAM VPS", ram: 16, price: 210 },
  { key: "vps-32", name: "32GB RAM VPS", ram: 32, price: 310 },
  { key: "vps-48", name: "48GB RAM VPS", ram: 48, price: 410 },
  { key: "vps-64", name: "64GB RAM VPS", ram: 64, price: 510 },
];

export function findPlan(key: string) {
  return (
    [...BUDGET_PLANS, ...PREMIUM_PLANS].find((p) => p.key === key) ??
    VPS_PLANS.find((p) => p.key === key) ??
    null
  );
}

/* ---------------- Payment details ---------------- */

export const PAY_METHODS = [
  {
    key: "jazzcash",
    label: "JazzCash",
    kind: "pk",
    phone: "0300533433",
    name: "HUS(S)NAIN KHURSHID",
  },
  {
    key: "easypaisa",
    label: "EasyPaisa",
    kind: "pk",
    phone: "0300533433",
    name: "HUS(S)NAIN KHURSHID",
  },
  { key: "upi", label: "UPI / Google Pay", kind: "in" },
] as const;

export const UPI_QR =
  "https://cdn.discordapp.com/attachments/1532803575468789882/1534506909875441745/GooglePay_QR.png?ex=6a75092d&is=6a73b7ad&hm=7994064d784f36718b783fbee7b6077ce9918368171c031331ef3344d27ea198&";
