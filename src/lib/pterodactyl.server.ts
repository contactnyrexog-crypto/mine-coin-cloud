const PANEL = () => process.env["PTERODACTYL_URL"]!.replace(/\/$/, "");
const KEY = () => process.env["PTERODACTYL_API_KEY"] ?? "";

async function api(path: string, init?: RequestInit) {
  const res = await fetch(`${PANEL()}/api/application${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${KEY()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Panel request failed [${res.status}]: ${text}`);
  return text ? JSON.parse(text) : null;
}

export async function panelConfigured() {
  return Boolean(process.env["PTERODACTYL_URL"] && process.env["PTERODACTYL_API_KEY"]);
}

export async function findOrCreateUser(email: string, password?: string) {
  const found = await api(`/users?filter[email]=${encodeURIComponent(email)}`);
  const existing = found?.data?.[0]?.attributes;
  if (existing) return existing;
  const username = email.split("@")[0]!.replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 16) || "user";
  const created = await api(`/users`, {
    method: "POST",
    body: JSON.stringify({
      email,
      username: `${username}${Math.floor(Math.random() * 9999)}`,
      first_name: username,
      last_name: "NetHost",
      password: password ?? crypto.randomUUID(),
    }),
  });
  return created.attributes;
}

export async function randomAllocation(nodeId: number) {
  const res = await api(`/nodes/${nodeId}/allocations?per_page=500`);
  const free = (res?.data ?? []).filter((a: any) => !a.attributes.assigned);
  if (!free.length) throw new Error("No free allocations available on this node right now.");
  const pick = free[Math.floor(Math.random() * free.length)];
  return pick.attributes.id as number;
}

export async function findEgg(eggKey: string) {
  const nests = await api(`/nests?include=eggs&per_page=100`);
  const needle = eggKey.toLowerCase();
  for (const nest of nests?.data ?? []) {
    for (const egg of nest.attributes.relationships?.eggs?.data ?? []) {
      const name = String(egg.attributes.name).toLowerCase();
      if (name.includes(needle) || (needle === "nodejs" && name.includes("node"))) {
        const nestId = nest.attributes.id as number;
        const eggId = egg.attributes.id as number;
        // the nests listing does not include variables; fetch the full egg
        const full = await api(`/nests/${nestId}/eggs/${eggId}?include=variables`);
        return { eggId, nestId, egg: full?.attributes ?? egg.attributes };
      }
    }
  }
  throw new Error(`Egg "${eggKey}" not found on the panel.`);
}

const ENV_FALLBACKS: Record<string, string> = {
  SERVER_JARFILE: "server.jar",
  BUILD_NUMBER: "latest",
  MINECRAFT_VERSION: "latest",
  VANILLA_VERSION: "latest",
  BUNGEE_VERSION: "latest",
  MC_VERSION: "latest",
  VERSION: "latest",
  PROJECT: "paper",
  DL_PATH: "",
};

export async function createPanelServer(opts: {
  email: string;
  password?: string;
  name: string;
  eggKey: string;
  nodeId: number;
  ramMb: number;
  diskGb: number;
  cpuPercent: number;
}) {
  const user = await findOrCreateUser(opts.email, opts.password);
  const { eggId, egg } = await findEgg(opts.eggKey);
  const allocation = await randomAllocation(opts.nodeId);

  const environment: Record<string, string> = {};
  for (const v of egg.relationships?.variables?.data ?? []) {
    const a = v.attributes;
    let value = a.default_value;
    if (value === null || value === undefined || value === "") {
      value = ENV_FALLBACKS[a.env_variable] ?? "";
    }
    const required = String(a.rules ?? "").includes("required");
    if (required && value === "") value = ENV_FALLBACKS[a.env_variable] ?? "latest";
    environment[a.env_variable] = String(value);
  }


  const server = await api(`/servers`, {
    method: "POST",
    body: JSON.stringify({
      name: opts.name,
      user: user.id,
      egg: eggId,
      docker_image: egg.docker_image,
      startup: egg.startup,
      environment,
      limits: {
        memory: opts.ramMb,
        swap: 0,
        disk: opts.diskGb * 1024,
        io: 500,
        cpu: opts.cpuPercent,
      },
      feature_limits: { databases: 1, backups: 1, allocations: 1 },
      allocation: { default: allocation },
    }),
  });

  return { serverId: String(server.attributes.id), identifier: server.attributes.identifier, panelUser: user };
}
