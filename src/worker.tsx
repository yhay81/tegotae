import { Hono } from "hono";
import { requestId } from "hono/request-id";

import { beaconScript } from "./beacon";
import { securityHeaders } from "./middleware/security";
import { DashboardPage, HomePage, NotFoundPage, PrivacyPage } from "./ui/pages";

export type Bindings = {
  ASSETS: Fetcher;
  DB: D1Database;
};

export type SiteRow = {
  access_key_hash: string;
  created_at: number;
  hostname: string;
  id: string;
  is_automated: number;
  last_seen_at: number | null;
  name: string;
};

type CountRow = {
  count: number;
};

type DailyRow = CountRow & {
  occurred_on: string;
};

type HourlyRow = CountRow & {
  occurred_hour: number;
};

type NamedCountRow = CountRow & {
  name: string;
};

const app = new Hono<{ Bindings: Bindings }>();
const siteIdPattern = /^[0-9a-f]{32}$/;
const accessKeyPattern = /^[0-9a-f]{64}$/;
const sessionIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const eventNames = new Set([
  "visited",
  "site_created",
  "dashboard_opened",
  "snippet_copied",
  "dashboard_link_copied",
  "returned",
]);
const daySeconds = 86_400;
const retentionDays = 365;

app.use("*", requestId());
app.use("*", securityHeaders);

const nowSeconds = () => Math.floor(Date.now() / 1000);

const randomHex = (bytes: number) => {
  const values = crypto.getRandomValues(new Uint8Array(bytes));
  return [...values].map((value) => value.toString(16).padStart(2, "0")).join("");
};

const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const constantTimeEqual = (left: string, right: string) => {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
};

const normalize = (value: unknown, maximum: number) =>
  typeof value === "string" ? value.normalize("NFKC").trim().slice(0, maximum) : "";

const isSameOriginMutation = (request: Request) => {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite) return fetchSite === "same-origin";
  const origin = request.headers.get("origin");
  return origin === new URL(request.url).origin;
};

const isJsonRequest = (request: Request) =>
  request.headers.get("content-type")?.toLowerCase().startsWith("application/json") ?? false;

const noStore = async (response: Response | Promise<Response>) => {
  const resolved = await response;
  resolved.headers.set("Cache-Control", "no-store, private");
  resolved.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return resolved;
};

const jstDate = (timestamp = Date.now()) =>
  new Date(timestamp + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

const jstHour = (timestamp = Date.now()) =>
  Number(new Date(timestamp + 9 * 60 * 60 * 1000).toISOString().slice(11, 13));

const addDays = (date: string, amount: number) => {
  const timestamp = Date.parse(`${date}T00:00:00.000Z`);
  return new Date(timestamp + amount * daySeconds * 1000).toISOString().slice(0, 10);
};

const numberValue = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const siteForOwner = async (db: D1Database, id: string, key: string) => {
  if (!siteIdPattern.test(id) || !accessKeyPattern.test(key)) return null;
  const site = await db.prepare("SELECT * FROM sites WHERE id = ?").bind(id).first<SiteRow>();
  if (!site) return null;
  const suppliedHash = await sha256(key);
  return constantTimeEqual(site.access_key_hash, suppliedHash) ? site : null;
};

const normalizeHomepage = (value: unknown) => {
  const input = normalize(value, 500);
  if (!input) return null;
  try {
    const url = new URL(input);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (!url.hostname || url.username || url.password || url.port) return null;
    if (url.hostname === "localhost" || url.hostname.endsWith(".localhost")) return null;
    return {
      hostname: url.hostname.toLowerCase().slice(0, 253),
      url: `${url.protocol}//${url.hostname.toLowerCase()}/`,
    };
  } catch {
    return null;
  }
};

const normalizePath = (value: unknown) => {
  const path = normalize(value, 500).split(/[?#]/, 1)[0] ?? "";
  return path.startsWith("/") && !path.startsWith("//") ? path : "/";
};

const normalizeReferrer = (value: unknown, siteHostname: string) => {
  const referrer = normalize(value, 600);
  if (!referrer) return "";
  try {
    const hostname = new URL(referrer).hostname.toLowerCase();
    return hostname === siteHostname ? "" : hostname.slice(0, 253);
  } catch {
    return "";
  }
};

const requestHostname = (request: Request) => {
  const origin = request.headers.get("origin");
  if (!origin || origin === "null") return null;
  try {
    const url = new URL(origin);
    return ["http:", "https:"].includes(url.protocol) ? url.hostname.toLowerCase() : null;
  } catch {
    return null;
  }
};

const eventStatement = async (
  db: D1Database,
  sessionId: string,
  name: string,
  siteId = "",
  automated = false,
) =>
  db
    .prepare(
      `INSERT INTO product_events
       (session_hash, name, site_id, is_automated, occurred_on, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(await sha256(sessionId), name, siteId, automated ? 1 : 0, jstDate(), nowSeconds());

app.get("/", (c) => c.html(<HomePage />));
app.get("/privacy", (c) => c.html(<PrivacyPage />));
app.get("/s/:id", (c) => {
  const id = c.req.param("id");
  return siteIdPattern.test(id)
    ? noStore(c.html(<DashboardPage siteId={id} />))
    : noStore(c.html(<NotFoundPage />, 404));
});

app.get("/beacon.js", (c) => {
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Cache-Control", "public, max-age=3600");
  c.header("Content-Type", "application/javascript; charset=utf-8");
  c.header("Cross-Origin-Resource-Policy", "cross-origin");
  return c.body(beaconScript);
});

app.post("/api/sites", async (c) => {
  if (!isSameOriginMutation(c.req.raw)) return c.json({ error: "forbidden" }, 403);
  if (!isJsonRequest(c.req.raw)) return c.json({ error: "unsupported_media_type" }, 415);
  if (Number(c.req.header("content-length") ?? 0) > 4_000) {
    return c.json({ error: "payload_too_large" }, 413);
  }

  const body = await c.req.json<{
    automated?: boolean;
    homepage?: unknown;
    name?: unknown;
    sessionId?: unknown;
    website?: unknown;
  }>();
  if (normalize(body.website, 100)) return c.json({ error: "invalid" }, 400);
  const sessionId = normalize(body.sessionId, 36);
  const name = normalize(body.name, 50);
  const homepage = normalizeHomepage(body.homepage);
  if (!sessionIdPattern.test(sessionId) || name.length < 1 || !homepage) {
    return c.json({ error: "invalid_site" }, 400);
  }

  const sessionHash = await sha256(sessionId);
  const daily = await c.env.DB.prepare(
    `SELECT COUNT(*) AS count FROM product_events
     WHERE session_hash = ? AND name = 'site_created' AND created_at >= ?`,
  )
    .bind(sessionHash, nowSeconds() - daySeconds)
    .first<CountRow>();
  if (numberValue(daily?.count) >= 3) return c.json({ error: "rate_limited" }, 429);

  const id = randomHex(16);
  const accessKey = randomHex(32);
  const createdAt = nowSeconds();
  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO sites
       (id, access_key_hash, name, hostname, is_automated, created_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?, ?, NULL)`,
    ).bind(
      id,
      await sha256(accessKey),
      name,
      homepage.hostname,
      body.automated === true ? 1 : 0,
      createdAt,
    ),
    await eventStatement(c.env.DB, sessionId, "site_created", id, body.automated === true),
  ]);

  return noStore(
    c.json(
      {
        dashboardUrl: `/s/${id}#${accessKey}`,
        homepage: homepage.url,
        id,
      },
      201,
    ),
  );
});

app.get("/api/sites/:id/dashboard", async (c) => {
  const id = c.req.param("id");
  const key = c.req.header("x-site-key") ?? "";
  const site = await siteForOwner(c.env.DB, id, key);
  if (!site) return noStore(c.json({ error: "forbidden" }, 403));

  const today = jstDate();
  const currentStart = addDays(today, -6);
  const comparisonStart = addDays(today, -13);
  const [dailyResult, hourlyResult, pageResult, referrerResult] = await Promise.all([
    c.env.DB.prepare(
      `SELECT occurred_on, SUM(count) AS count
       FROM pageview_buckets
       WHERE site_id = ? AND occurred_on >= ?
       GROUP BY occurred_on ORDER BY occurred_on`,
    )
      .bind(id, comparisonStart)
      .all<DailyRow>(),
    c.env.DB.prepare(
      `SELECT occurred_hour, SUM(count) AS count
       FROM pageview_buckets
       WHERE site_id = ? AND occurred_on = ?
       GROUP BY occurred_hour ORDER BY occurred_hour`,
    )
      .bind(id, today)
      .all<HourlyRow>(),
    c.env.DB.prepare(
      `SELECT path AS name, SUM(count) AS count
       FROM pageview_buckets
       WHERE site_id = ? AND occurred_on >= ?
       GROUP BY path ORDER BY count DESC, path LIMIT 8`,
    )
      .bind(id, currentStart)
      .all<NamedCountRow>(),
    c.env.DB.prepare(
      `SELECT referrer_host AS name, SUM(count) AS count
       FROM pageview_buckets
       WHERE site_id = ? AND occurred_on >= ?
       GROUP BY referrer_host ORDER BY count DESC, referrer_host LIMIT 8`,
    )
      .bind(id, currentStart)
      .all<NamedCountRow>(),
  ]);

  const dailyMap = new Map(
    (dailyResult.results ?? []).map((row) => [row.occurred_on, numberValue(row.count)]),
  );
  const daily = Array.from({ length: 14 }, (_, index) => {
    const date = addDays(comparisonStart, index);
    return { count: dailyMap.get(date) ?? 0, date };
  });
  const previousViews = daily.slice(0, 7).reduce((sum, row) => sum + row.count, 0);
  const currentViews = daily.slice(7).reduce((sum, row) => sum + row.count, 0);
  const hourlyMap = new Map(
    (hourlyResult.results ?? []).map((row) => [row.occurred_hour, numberValue(row.count)]),
  );

  return noStore(
    c.json({
      chart: {
        daily,
        hourly: Array.from({ length: 24 }, (_, hour) => ({
          count: hourlyMap.get(hour) ?? 0,
          hour,
        })),
      },
      site: {
        createdAt: site.created_at,
        hostname: site.hostname,
        id: site.id,
        lastSeenAt: site.last_seen_at,
        name: site.name,
        retentionDays,
      },
      summary: {
        currentViews,
        previousViews,
        todayViews: daily.at(-1)?.count ?? 0,
      },
      topPages: (pageResult.results ?? []).map((row) => ({
        count: numberValue(row.count),
        name: row.name,
      })),
      topReferrers: (referrerResult.results ?? []).map((row) => ({
        count: numberValue(row.count),
        name: row.name || "直接・不明",
      })),
    }),
  );
});

app.delete("/api/sites/:id", async (c) => {
  if (!isSameOriginMutation(c.req.raw)) return c.json({ error: "forbidden" }, 403);
  const id = c.req.param("id");
  const key = c.req.header("x-site-key") ?? "";
  const site = await siteForOwner(c.env.DB, id, key);
  if (!site) return noStore(c.json({ error: "forbidden" }, 403));
  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM pageview_buckets WHERE site_id = ?").bind(id),
    c.env.DB.prepare("DELETE FROM product_events WHERE site_id = ?").bind(id),
    c.env.DB.prepare("DELETE FROM sites WHERE id = ?").bind(id),
  ]);
  return noStore(c.body(null, 204));
});

app.options("/b/:id", async (c) => {
  const id = c.req.param("id");
  const site = siteIdPattern.test(id)
    ? await c.env.DB.prepare("SELECT * FROM sites WHERE id = ?").bind(id).first<SiteRow>()
    : null;
  const hostname = requestHostname(c.req.raw);
  if (!site || hostname !== site.hostname) return c.body(null, 403);
  const origin = c.req.header("origin") ?? "";
  c.header("Access-Control-Allow-Headers", "content-type");
  c.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  c.header("Access-Control-Allow-Origin", origin);
  c.header("Access-Control-Max-Age", "86400");
  c.header("Vary", "Origin");
  return c.body(null, 204);
});

app.post("/b/:id", async (c) => {
  const id = c.req.param("id");
  if (!siteIdPattern.test(id)) return c.body(null, 404);
  if (Number(c.req.header("content-length") ?? 0) > 2_048) return c.body(null, 413);
  const site = await c.env.DB.prepare("SELECT * FROM sites WHERE id = ?").bind(id).first<SiteRow>();
  const hostname = requestHostname(c.req.raw);
  if (!site || hostname !== site.hostname) return c.body(null, 403);

  let body: { path?: unknown; referrer?: unknown };
  try {
    const text = await c.req.text();
    if (text.length > 2_048) return c.body(null, 413);
    body = JSON.parse(text) as { path?: unknown; referrer?: unknown };
  } catch {
    return c.body(null, 400);
  }

  const path = normalizePath(body.path);
  const referrer = normalizeReferrer(body.referrer, site.hostname);
  const occurredOn = jstDate();
  const occurredHour = jstHour();
  const timestamp = nowSeconds();
  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO pageview_buckets
       (site_id, occurred_on, occurred_hour, path, referrer_host, count, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?)
       ON CONFLICT (site_id, occurred_on, occurred_hour, path, referrer_host)
       DO UPDATE SET count = count + 1, updated_at = excluded.updated_at`,
    ).bind(id, occurredOn, occurredHour, path, referrer, timestamp),
    c.env.DB.prepare("UPDATE sites SET last_seen_at = ? WHERE id = ?").bind(timestamp, id),
  ]);

  const origin = c.req.header("origin") ?? "";
  c.header("Access-Control-Allow-Origin", origin);
  c.header("Cache-Control", "no-store");
  c.header("Vary", "Origin");
  return c.body(null, 204);
});

app.post("/api/events", async (c) => {
  if (!isSameOriginMutation(c.req.raw)) return c.json({ error: "forbidden" }, 403);
  if (!isJsonRequest(c.req.raw)) return c.json({ error: "unsupported_media_type" }, 415);
  const body = await c.req.json<{
    automated?: boolean;
    name?: unknown;
    sessionId?: unknown;
    siteId?: unknown;
  }>();
  const sessionId = normalize(body.sessionId, 36);
  const name = normalize(body.name, 40);
  const siteId = normalize(body.siteId, 32);
  if (
    !sessionIdPattern.test(sessionId) ||
    !eventNames.has(name) ||
    (siteId && !siteIdPattern.test(siteId))
  ) {
    return c.json({ error: "invalid_event" }, 400);
  }
  await (await eventStatement(c.env.DB, sessionId, name, siteId, body.automated === true)).run();
  return c.body(null, 204);
});

app.get("/healthz", (c) =>
  c.json({
    healthy: true,
    retentionDays,
    service: "tegotae",
    time: new Date().toISOString(),
  }),
);

app.notFound((c) =>
  c.req.path.startsWith("/api/") || c.req.path.startsWith("/b/")
    ? c.json({ error: "not_found", requestId: c.get("requestId") }, 404)
    : c.html(<NotFoundPage />, 404),
);

app.onError((error, c) => {
  console.error(
    JSON.stringify({
      event: "request_failed",
      message: error.message,
      requestId: c.get("requestId"),
    }),
  );
  return c.json({ error: "internal_error", requestId: c.get("requestId") }, 500);
});

const scheduled: ExportedHandlerScheduledHandler<Bindings> = async (_controller, env) => {
  const now = nowSeconds();
  const today = jstDate();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM pageview_buckets WHERE occurred_on < ?").bind(
      addDays(today, -(retentionDays + 1)),
    ),
    env.DB.prepare("DELETE FROM product_events WHERE created_at < ?").bind(now - 35 * daySeconds),
    env.DB.prepare("DELETE FROM sites WHERE last_seen_at IS NULL AND created_at < ?").bind(
      now - 35 * daySeconds,
    ),
  ]);
};

export {
  addDays,
  app,
  constantTimeEqual,
  jstDate,
  normalizeHomepage,
  normalizePath,
  normalizeReferrer,
};
export default { fetch: app.fetch, scheduled };
