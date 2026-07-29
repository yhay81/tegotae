import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  app,
  type Bindings,
  type SiteRow,
  jstDate,
  normalizeHomepage,
  normalizePath,
  normalizeReferrer,
} from "../src/worker";

const sessionId = "7c0dbe70-8c47-4fc0-aa62-52427133c612";
const siteId = "a".repeat(32);
const accessKey = "1".repeat(64);
const sameOrigin = { "content-type": "application/json", "sec-fetch-site": "same-origin" };

type State = {
  dailyCount?: number;
  dailyRows?: Array<{ count: number; occurred_on: string }>;
  hourlyRows?: Array<{ count: number; occurred_hour: number }>;
  pageRows?: Array<{ count: number; name: string }>;
  referrerRows?: Array<{ count: number; name: string }>;
  site?: SiteRow | null;
};

const hash = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const defaultSite = async (): Promise<SiteRow> => ({
  access_key_hash: await hash(accessKey),
  created_at: Math.floor(Date.now() / 1000) - 86_400,
  hostname: "example.com",
  id: siteId,
  is_automated: 0,
  last_seen_at: Math.floor(Date.now() / 1000),
  name: "小さな本屋の日記",
});

const makeBindings = (state: State = {}) => {
  const calls: Array<{ arguments: unknown[]; sql: string }> = [];
  const batch = vi.fn(async () => []);
  const prepare = vi.fn((sql: string) => {
    const call = { arguments: [] as unknown[], sql };
    calls.push(call);
    const statement = {
      all: vi.fn(async () => {
        if (sql.includes("GROUP BY occurred_on")) return { results: state.dailyRows ?? [] };
        if (sql.includes("GROUP BY occurred_hour")) return { results: state.hourlyRows ?? [] };
        if (sql.includes("GROUP BY path")) return { results: state.pageRows ?? [] };
        if (sql.includes("GROUP BY referrer_host")) {
          return { results: state.referrerRows ?? [] };
        }
        return { results: [] };
      }),
      bind: vi.fn((...arguments_: unknown[]) => {
        call.arguments = arguments_;
        return statement;
      }),
      first: vi.fn(async () => {
        if (sql.includes("COUNT(*) AS count FROM product_events")) {
          return { count: state.dailyCount ?? 0 };
        }
        if (sql.includes("SELECT * FROM sites")) return state.site ?? null;
        return null;
      }),
      run: vi.fn(async () => ({ success: true })),
    };
    return statement;
  });
  return {
    batch,
    bindings: {
      ASSETS: { fetch: () => Promise.resolve(new Response("not used")) },
      DB: { batch, prepare },
    } as unknown as Bindings,
    calls,
  };
};

describe("手ごたえ worker", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("renders the setup instrument and visual dashboard without experiment copy", async () => {
    const response = await app.request("/", undefined, makeBindings().bindings);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-security-policy")).toContain("default-src 'self'");
    expect(html).toContain('lang="ja"');
    expect(html).toContain('class="dashboard-mock"');
    expect(html).toContain("計測タグをつくる");
    expect(html).toContain("Cookie");
    expect(html).toContain("読まれたページ");
    expect(html).not.toContain('class="hero"');
    expect(html).not.toContain("成功条件");
    expect(html).not.toContain("PUBLIC VALIDATION");
  });

  it("normalizes site URLs, paths, and referrers without retaining queries", () => {
    expect(normalizeHomepage("https://Example.com/secret?token=1")).toEqual({
      hostname: "example.com",
      url: "https://example.com/",
    });
    expect(normalizeHomepage("javascript:alert(1)")).toBeNull();
    expect(normalizeHomepage("http://localhost:3000")).toBeNull();
    expect(normalizePath("/entry/朝?member=123#reply")).toBe("/entry/朝");
    expect(normalizePath("https://evil.example/path")).toBe("/");
    expect(normalizeReferrer("https://search.example/result?q=name", "example.com")).toBe(
      "search.example",
    );
    expect(normalizeReferrer("https://example.com/internal", "example.com")).toBe("");
  });

  it("creates a site and returns the management key only in a URL fragment", async () => {
    const { batch, bindings, calls } = makeBindings();
    const response = await app.request(
      "/api/sites",
      {
        body: JSON.stringify({
          automated: false,
          homepage: "https://example.com/articles?private=1",
          name: "小さな本屋の日記",
          sessionId,
          website: "",
        }),
        headers: sameOrigin,
        method: "POST",
      },
      bindings,
    );
    const result = await response.json<{ dashboardUrl: string; homepage: string; id: string }>();

    expect(response.status).toBe(201);
    expect(result.homepage).toBe("https://example.com/");
    expect(result.id).toMatch(/^[0-9a-f]{32}$/);
    expect(result.dashboardUrl).toMatch(/^\/s\/[0-9a-f]{32}#[0-9a-f]{64}$/);
    expect(batch).toHaveBeenCalledTimes(1);
    const insert = calls.find((call) => call.sql.includes("INSERT INTO sites"));
    expect(insert?.arguments).toContain("example.com");
    expect(insert?.arguments).toContain("小さな本屋の日記");
    expect(JSON.stringify(insert?.arguments)).not.toContain(result.dashboardUrl.split("#")[1]);
  });

  it("rejects cross-site, honeypot, invalid, and excessive site creation", async () => {
    const body = {
      homepage: "https://example.com",
      name: "小さな本屋",
      sessionId,
      website: "",
    };
    const crossSite = await app.request(
      "/api/sites",
      {
        body: JSON.stringify(body),
        headers: { "content-type": "application/json", "sec-fetch-site": "cross-site" },
        method: "POST",
      },
      makeBindings().bindings,
    );
    expect(crossSite.status).toBe(403);

    const honeypot = await app.request(
      "/api/sites",
      {
        body: JSON.stringify({ ...body, website: "https://spam.example" }),
        headers: sameOrigin,
        method: "POST",
      },
      makeBindings().bindings,
    );
    expect(honeypot.status).toBe(400);

    const invalid = await app.request(
      "/api/sites",
      {
        body: JSON.stringify({ ...body, homepage: "file:///private" }),
        headers: sameOrigin,
        method: "POST",
      },
      makeBindings().bindings,
    );
    expect(invalid.status).toBe(400);

    const limited = await app.request(
      "/api/sites",
      { body: JSON.stringify(body), headers: sameOrigin, method: "POST" },
      makeBindings({ dailyCount: 3 }).bindings,
    );
    expect(limited.status).toBe(429);
  });

  it("serves a state-free beacon script with cross-origin resource permission", async () => {
    const response = await app.request("/beacon.js", undefined, makeBindings().bindings);
    const source = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/javascript");
    expect(response.headers.get("cross-origin-resource-policy")).toBe("cross-origin");
    expect(source).toContain("location.pathname");
    expect(source).toContain("sendBeacon");
    expect(source).not.toContain("cookie");
    expect(source).not.toContain("localStorage");
  });

  it("accepts beacons only from the configured hostname and stores an aggregate increment", async () => {
    const site = await defaultSite();
    const valid = makeBindings({ site });
    const response = await app.request(
      `/b/${siteId}`,
      {
        body: JSON.stringify({
          path: "/entry/朝?member=123",
          referrer: "https://search.example/result?q=private",
        }),
        headers: { "content-type": "text/plain", origin: "https://example.com" },
        method: "POST",
      },
      valid.bindings,
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe("https://example.com");
    expect(valid.batch).toHaveBeenCalledTimes(1);
    const aggregate = valid.calls.find((call) => call.sql.includes("pageview_buckets"));
    expect(aggregate?.arguments).toContain("/entry/朝");
    expect(aggregate?.arguments).toContain("search.example");
    expect(JSON.stringify(aggregate?.arguments)).not.toContain("member=123");
    expect(JSON.stringify(aggregate?.arguments)).not.toContain("q=private");

    const rejected = await app.request(
      `/b/${siteId}`,
      {
        body: JSON.stringify({ path: "/" }),
        headers: { "content-type": "text/plain", origin: "https://other.example" },
        method: "POST",
      },
      makeBindings({ site }).bindings,
    );
    expect(rejected.status).toBe(403);
  });

  it("returns aggregate trends only to the fragment-key owner", async () => {
    const site = await defaultSite();
    const bindings = makeBindings({
      dailyRows: [{ count: 12, occurred_on: jstDate() }],
      hourlyRows: [{ count: 4, occurred_hour: 9 }],
      pageRows: [{ count: 8, name: "/entry/朝" }],
      referrerRows: [
        { count: 7, name: "search.example" },
        { count: 5, name: "" },
      ],
      site,
    }).bindings;

    const forbidden = await app.request(`/api/sites/${siteId}/dashboard`, undefined, bindings);
    expect(forbidden.status).toBe(403);

    const response = await app.request(
      `/api/sites/${siteId}/dashboard`,
      { headers: { "x-site-key": accessKey } },
      bindings,
    );
    const text = await response.text();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(text).toContain('"todayViews":12');
    expect(text).toContain('"currentViews":12');
    expect(text).toContain('"name":"/entry/朝"');
    expect(text).toContain('"name":"直接・不明"');
    expect(text).not.toContain("access_key_hash");
  });

  it("lets only the fragment-key owner delete site settings and aggregates", async () => {
    const site = await defaultSite();
    const invalid = await app.request(
      `/api/sites/${siteId}`,
      {
        headers: { "sec-fetch-site": "same-origin", "x-site-key": "2".repeat(64) },
        method: "DELETE",
      },
      makeBindings({ site }).bindings,
    );
    expect(invalid.status).toBe(403);

    const valid = makeBindings({ site });
    const removed = await app.request(
      `/api/sites/${siteId}`,
      {
        headers: { "sec-fetch-site": "same-origin", "x-site-key": accessKey },
        method: "DELETE",
      },
      valid.bindings,
    );
    expect(removed.status).toBe(204);
    expect(valid.batch).toHaveBeenCalledTimes(1);
    expect(valid.calls.some((call) => call.sql.includes("DELETE FROM sites"))).toBe(true);
    expect(valid.calls.some((call) => call.sql.includes("DELETE FROM pageview_buckets"))).toBe(
      true,
    );
  });

  it("documents aggregate-only measurement, retention, management keys, and site disclosure", async () => {
    const response = await app.request("/privacy", undefined, makeBindings().bindings);
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain("1件ずつの閲覧履歴");
    expect(html).toContain("IPアドレス");
    expect(html).toContain("最大365日");
    expect(html).toContain("URLの「#」より後ろ");
    expect(html).toContain("外部送信");
  });

  it("serves safe HTML and JSON fallbacks with a machine-readable health endpoint", async () => {
    const bindings = makeBindings().bindings;
    const page = await app.request("/missing", undefined, bindings);
    const api = await app.request("/api/missing", undefined, bindings);
    const health = await app.request("/healthz", undefined, bindings);
    expect(page.status).toBe(404);
    expect(await page.text()).toContain("ページが見つかりません");
    expect(api.status).toBe(404);
    expect(await api.json()).toEqual(expect.objectContaining({ error: "not_found" }));
    expect(await health.json()).toEqual(
      expect.objectContaining({ healthy: true, retentionDays: 365, service: "tegotae" }),
    );
  });
});
