/**
 * Local browser-backed data store.
 *
 * Everything the app used to keep in a hosted database now lives in this
 * browser's localStorage. That means:
 *  - data never leaves the machine it was created on
 *  - clearing site data wipes accounts, coins, orders and server records
 *  - values here are user-editable, so treat them as untrusted
 */

const DB_KEY = "nethost.db.v1";
const SESSION_KEY = "nethost.session.v1";
const PROOF_PREFIX = "nethost.proof.";

/** Seeded as admin on first run so there is always a way into /admin. */
export const ADMIN_EMAILS = ["contactnyrexog@gmail.com"];

export const DEFAULTS = { coins: 0, ram_mb: 2048, disk_gb: 5, cpu_percent: 75 };

export type Profile = {
  id: string;
  email: string;
  coins: number;
  ram_mb: number;
  disk_gb: number;
  cpu_percent: number;
  currency: string;
  billing_email: string | null;
  billing_address: string | null;
  joined_nethost: boolean;
  joined_mentionhost: boolean;
  last_afk_credit: string | null;
  created_at: string;
  updated_at: string;
};

export type Account = { id: string; email: string; salt: string; hash: string; created_at: string };

export type Order = {
  id: string;
  user_id: string;
  product_type: string;
  plan_key: string;
  plan_name: string;
  plan_tier: string | null;
  price_inr: number;
  currency: string;
  amount: number;
  discount: number;
  coupon_code: string | null;
  payment_method: string;
  billing_email: string;
  billing_address: string | null;
  proof_url: string | null;
  status: string;
  reject_reason: string | null;
  delivery: Record<string, unknown> | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ServerRow = {
  id: string;
  user_id: string;
  name: string;
  egg: string;
  node_id: number;
  node_name: string;
  ram_mb: number;
  disk_gb: number;
  cpu_percent: number;
  panel_server_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type RedeemCode = {
  id: string;
  code: string;
  kind: string;
  coins: number;
  ram_mb: number;
  disk_gb: number;
  cpu_percent: number;
  discount_percent: number;
  discount_inr: number;
  uses_per_user: number;
  max_uses: number;
  used_count: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Redemption = { id: string; code_id: string; user_id: string; created_at: string };

type DB = {
  accounts: Account[];
  profiles: Profile[];
  orders: Order[];
  servers: ServerRow[];
  redeem_codes: RedeemCode[];
  redemptions: Redemption[];
  roles: { user_id: string; role: string }[];
};

const EMPTY: DB = {
  accounts: [],
  profiles: [],
  orders: [],
  servers: [],
  redeem_codes: [],
  redemptions: [],
  roles: [],
};

export function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readDB(): DB {
  if (!isBrowser()) return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(DB_KEY);
    if (!raw) return { ...EMPTY };
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<DB>) };
  } catch {
    return { ...EMPTY };
  }
}

function writeDB(db: DB) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (err) {
    throw new Error(
      "Browser storage is full. Remove old orders or payment proofs to free space." +
        (err instanceof Error ? "" : ""),
    );
  }
}

/** Read-modify-write helper so callers never forget to persist. */
export function tx<T>(fn: (db: DB) => T): T {
  const db = readDB();
  const out = fn(db);
  writeDB(db);
  return out;
}

export function query<T>(fn: (db: DB) => T): T {
  return fn(readDB());
}

export function uid() {
  if (isBrowser() && window.crypto?.randomUUID) return window.crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function now() {
  return new Date().toISOString();
}

/* ---------------------------------------------------------------- passwords */

function toHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashPassword(password: string, salt: string) {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return toHex(digest);
}

export function makeSalt() {
  const arr = new Uint8Array(16);
  window.crypto.getRandomValues(arr);
  return toHex(arr.buffer);
}

/* ----------------------------------------------------------------- session */

export type SessionUser = { id: string; email: string };

export function getSession(): SessionUser | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function setSession(user: SessionUser | null) {
  if (!isBrowser()) return;
  if (user) window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("nethost:auth"));
}

export function requireSession(): SessionUser {
  const s = getSession();
  if (!s) throw new Error("You are signed out. Sign in again.");
  return s;
}

/* ---------------------------------------------------------------- accounts */

export async function signUpLocal(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const existing = query((db) => db.accounts.find((a) => a.email === normalized));
  if (existing) throw new Error("An account with that email already exists.");

  const salt = makeSalt();
  const hash = await hashPassword(password, salt);
  const id = uid();

  tx((db) => {
    db.accounts.push({ id, email: normalized, salt, hash, created_at: now() });
    db.profiles.push({
      id,
      email: normalized,
      ...DEFAULTS,
      currency: "INR",
      billing_email: null,
      billing_address: null,
      joined_nethost: false,
      joined_mentionhost: false,
      last_afk_credit: null,
      created_at: now(),
      updated_at: now(),
    });
    db.roles.push({ user_id: id, role: ADMIN_EMAILS.includes(normalized) ? "admin" : "user" });
  });

  return { id, email: normalized };
}

export async function signInLocal(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const account = query((db) => db.accounts.find((a) => a.email === normalized));
  if (!account) throw new Error("No account found with that email.");
  const hash = await hashPassword(password, account.salt);
  if (hash !== account.hash) throw new Error("Incorrect password.");
  const user = { id: account.id, email: account.email };
  setSession(user);
  return user;
}

export function signOutLocal() {
  setSession(null);
}

export function isAdmin(userId: string) {
  return query((db) => db.roles.some((r) => r.user_id === userId && r.role === "admin"));
}

export function ensureProfile(userId: string, email: string): Profile {
  return tx((db) => {
    let p = db.profiles.find((x) => x.id === userId);
    if (!p) {
      p = {
        id: userId,
        email,
        ...DEFAULTS,
        currency: "INR",
        billing_email: null,
        billing_address: null,
        joined_nethost: false,
        joined_mentionhost: false,
        last_afk_credit: null,
        created_at: now(),
        updated_at: now(),
      };
      db.profiles.push(p);
    }
    if (!db.roles.some((r) => r.user_id === userId)) {
      db.roles.push({ user_id: userId, role: ADMIN_EMAILS.includes(email) ? "admin" : "user" });
    }
    return p;
  });
}

export function updateProfile(userId: string, patch: Partial<Profile>) {
  return tx((db) => {
    const p = db.profiles.find((x) => x.id === userId);
    if (!p) throw new Error("Profile not found");
    Object.assign(p, patch, { updated_at: now() });
    return p;
  });
}

/* ---------------------------------------------------- payment proof images */

/**
 * Proof screenshots are downscaled to keep localStorage usable — full-size
 * phone screenshots would blow the ~5 MB per-origin budget in a few uploads.
 */
export async function compressImage(file: File, maxDim = 1000, quality = 0.6): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });

  if (!file.type.startsWith("image/")) return dataUrl;

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("That file isn't a readable image."));
    el.src = dataUrl;
  });

  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

export function saveProof(orderId: string, dataUrl: string) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(PROOF_PREFIX + orderId, dataUrl);
  } catch {
    throw new Error("Not enough browser storage for that screenshot. Try a smaller image.");
  }
}

export function loadProof(orderId: string): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(PROOF_PREFIX + orderId);
}

/* ------------------------------------------------------------ backup tools */

/** Because a cleared browser means total data loss, expose an export/import. */
export function exportBackup(): string {
  const db = readDB();
  const proofs: Record<string, string> = {};
  if (isBrowser()) {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(PROOF_PREFIX)) proofs[key] = window.localStorage.getItem(key) ?? "";
    }
  }
  return JSON.stringify({ version: 1, exported_at: now(), db, proofs }, null, 2);
}

export function importBackup(json: string) {
  const parsed = JSON.parse(json) as { db?: Partial<DB>; proofs?: Record<string, string> };
  if (!parsed.db) throw new Error("That file isn't a NETHOST backup.");
  writeDB({ ...EMPTY, ...parsed.db });
  if (parsed.proofs && isBrowser()) {
    for (const [key, value] of Object.entries(parsed.proofs)) {
      if (key.startsWith(PROOF_PREFIX)) window.localStorage.setItem(key, value);
    }
  }
}
