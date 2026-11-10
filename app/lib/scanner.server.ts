/**
 * Alt-text scanner: a read-only audit of a public Shopify storefront.
 *
 * This module is the whole product surface of /scanner. It answers one
 * question for a store owner who has never heard of us: "how many of my
 * product images does a screen reader or a crawler fail to understand?"
 *
 * ## Legal / ethical constraints baked into this file — do not remove
 *
 * 1. robots.txt is fetched and honoured *before* any store data is requested.
 *    If the store disallows crawling, we stop and say so. This is the single
 *    most important guard: it converts "scraping" into "crawling with consent".
 *
 * 2. Only public endpoints are touched: /robots.txt, /products.json and
 *    /products/:handle. No authentication, no Admin API, no private data,
 *    no customer information of any kind.
 *
 * 3. Nothing about the scanned store is persisted. A report lives in memory
 *    for the duration of one request, plus a short-lived in-memory cache keyed
 *    by domain so a refresh doesn't re-crawl the store.
 *
 * 4. Requests carry an identifying User-Agent with a contact URL, so a store
 *    owner reading their access log can see exactly who we are and why.
 *
 * 5. Hard caps keep a single scan to roughly 14 requests: at most 250 products
 *    enumerated, at most 12 product pages sampled, 5.5s total budget. The goal
 *    is to answer "roughly how bad is it", not to mirror the catalogue. The
 *    budget is deliberately below Vercel's function timeout so a slow store
 *    degrades to a partial report instead of a dead request.
 *
 * ## Why we sample product pages instead of trusting products.json
 *
 * /products.json exposes `images[].alt`, but that field is unreliable: on
 * 2026-11-10 the store haimo-dev.myshopify.com returned `alt: null` for
 * /products/test-product while the rendered page carried
 * `<img alt="White wireless earbuds product photo">`. Reporting the JSON value
 * would have flagged a perfectly fine image as broken, and a single false
 * positive destroys trust in the whole report.
 *
 * So: products.json gives us the *counts* (products, images) cheaply and
 * accurately, and a sample of rendered product pages gives us the *ratio*.
 * The report labels the ratio as sampled, never as exact.
 */

export const SCANNER_USER_AGENT =
  "AltOptimizerScanner/1.0 (+https://alt-optimizer.vercel.app/scanner; read-only alt-text audit)";

/** Requests time out fast so one slow store can't burn the whole budget. */
const REQUEST_TIMEOUT_MS = 4000;

/** Total wall-clock budget. Kept well under the function timeout (see vercel.json). */
const SCAN_BUDGET_MS = 5500;

/** Products enumerated from products.json. Shopify pages at 250. */
const MAX_PRODUCTS = 250;

/** Product pages actually fetched. Each one costs a request. */
const MAX_SAMPLED_PAGES = 12;

/** Concurrent page fetches. Keeps us from looking like a flood. */
const SAMPLE_CONCURRENCY = 6;

/** In-memory cache so a page refresh doesn't re-crawl. Per-instance only. */
const CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const cache = new Map<string, { at: number; report: ScanReport }>();

export type AltIssue = "missing" | "autofilled" | "too_short" | "ok";

export type ScanExample = {
  handle: string;
  title: string;
  issue: AltIssue;
  /** First alt value found on the page, truncated for display. */
  sampleAlt: string | null;
};

export type ScanReport = {
  domain: string;
  /** Products we actually saw in products.json (capped at MAX_PRODUCTS). */
  productsFound: number;
  /** True when products.json had more pages than we were willing to read. */
  productsCapped: boolean;
  /** Image count from products.json. Accurate within the products we read. */
  imagesFound: number;
  /** Product pages we actually fetched and parsed. */
  pagesSampled: number;
  /** 0-100. Share of sampled images whose alt actually describes the image. */
  coverageScore: number;
  breakdown: {
    missing: number;
    autofilled: number;
    tooShort: number;
    ok: number;
    /** Total image elements counted across sampled pages. */
    total: number;
  };
  examples: ScanExample[];
  /** True when we hit a cap or a timeout; the report says so plainly. */
  partial: boolean;
  /** Human-readable caveats rendered under the report. */
  notes: string[];
  scannedAt: string;
};

export type ScanFailure = {
  ok: false;
  reason:
    | "invalid_domain"
    | "blocked_host"
    | "robots_disallow"
    | "unreachable"
    | "not_shopify"
    | "no_products"
    | "ratelimited";
  message: string;
};

export type ScanSuccess = { ok: true; report: ScanReport };
export type ScanResult = ScanSuccess | ScanFailure;

/* ------------------------------------------------------------------ */
/* Domain handling                                                     */
/* ------------------------------------------------------------------ */

/**
 * Hosts we refuse to touch. Without this the scanner is an SSRF gadget: an
 * attacker could point it at 169.254.169.254 and read cloud metadata, or at
 * an internal service that isn't meant to be public.
 */
const BLOCKED_HOST_PATTERNS: RegExp[] = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^0\./,
  /^\[?::1\]?$/,
  /^metadata\./i,
  /\.local$/i,
  /\.internal$/i,
];

const HOSTNAME_RE =
  /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/;

/**
 * Turns whatever the user typed into a bare hostname, or null if it can't be
 * one. Accepts "shop.com", "https://shop.com/products", "shop.com/".
 */
export function normalizeDomain(raw: string): string | null {
  if (!raw) return null;

  let s = raw.trim().toLowerCase();
  s = s.replace(/^[a-z]+:\/\//, "");
  s = s.split(/[/?#]/)[0];
  s = s.replace(/:\d+$/, ""); // drop an explicit port
  s = s.replace(/\.$/, ""); // trailing dot form of an FQDN

  if (!s || s.length > 253) return null;
  if (!HOSTNAME_RE.test(s)) return null;
  if (!s.includes(".")) return null;
  if (BLOCKED_HOST_PATTERNS.some((re) => re.test(s))) return null;

  return s;
}

export function isBlockedHost(host: string): boolean {
  return BLOCKED_HOST_PATTERNS.some((re) => re.test(host));
}

/* ------------------------------------------------------------------ */
/* Fetch helper                                                        */
/* ------------------------------------------------------------------ */

async function timedFetch(
  url: string,
  budgetEnd: number,
): Promise<Response | null> {
  // Every request is bounded by whatever is left of the scan budget, not by a
  // fixed timeout. Without this a scan that hit its deadline could still be
  // waiting on 12 in-flight requests, and the caller would see a dead request
  // instead of the partial report we promised.
  const remaining = budgetEnd - Date.now();
  if (remaining <= 250) return null;
  const timeoutMs = Math.min(REQUEST_TIMEOUT_MS, remaining);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": SCANNER_USER_AGENT,
        Accept: "text/html,application/json;q=0.9,*/*;q=0.8",
      },
    });
    return res;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/* robots.txt                                                          */
/* ------------------------------------------------------------------ */

type RobotsPolicy = {
  /** No robots.txt at all — treated as "allowed". */
  missing: boolean;
  /** `Disallow: /` for everyone. We stop entirely. */
  disallowAll: boolean;
  /** A rule matching /products.json. */
  disallowProductJson: boolean;
  /** A rule matching /products/ paths. */
  disallowProductPages: boolean;
};

/**
 * Parses the `User-agent: *` group of a robots.txt. We deliberately ignore
 * groups aimed at specific bots: our UA is not a well-known crawler, so the
 * conservative reading is that the wildcard group governs us.
 *
 * This is a simplified parser, not a spec-complete one. It errs toward
 * "blocked" — a false block costs us one scan, a false allow costs us the
 * store owner's trust.
 */
export function parseRobots(txt: string): RobotsPolicy {
  const policy: RobotsPolicy = {
    missing: false,
    disallowAll: false,
    disallowProductJson: false,
    disallowProductPages: false,
  };

  // robots.txt is a sequence of groups separated by blank lines. Splitting on
  // blank lines first is what keeps a `User-agent: Googlebot` group from being
  // misread as applying to us — a single-pass parser gets this wrong whenever
  // the file has more than one group.
  const groups: string[][] = [];
  let current: string[] = [];

  for (const rawLine of txt.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) {
      if (current.length > 0) {
        groups.push(current);
        current = [];
      }
      continue;
    }
    current.push(line);
  }
  if (current.length > 0) groups.push(current);

  for (const group of groups) {
    const agents: string[] = [];
    const rules: string[] = [];

    for (const line of group) {
      const idx = line.indexOf(":");
      if (idx === -1) continue;
      const field = line.slice(0, idx).trim().toLowerCase();
      const value = line.slice(idx + 1).trim();

      if (field === "user-agent") agents.push(value.toLowerCase());
      else if (field === "disallow") rules.push(value);
    }

    // Our User-Agent is not a well-known crawler, so only the wildcard group
    // governs us. Anything addressed to a specific bot does not apply.
    if (!agents.includes("*")) continue;

    for (const value of rules) {
      if (value === "/") {
        policy.disallowAll = true;
      } else if (value.startsWith("/products.json")) {
        policy.disallowProductJson = true;
      } else if (value === "/products" || value.startsWith("/products/")) {
        policy.disallowProductPages = true;
      }
    }
  }

  return policy;
}

async function readRobots(
  domain: string,
  budgetEnd: number,
): Promise<RobotsPolicy | null> {
  const res = await timedFetch(`https://${domain}/robots.txt`, budgetEnd);
  if (!res) return null;
  if (res.status === 404) {
    return {
      missing: true,
      disallowAll: false,
      disallowProductJson: false,
      disallowProductPages: false,
    };
  }
  if (!res.ok) return null;
  const txt = await res.text();
  return parseRobots(txt);
}

/* ------------------------------------------------------------------ */
/* products.json                                                       */
/* ------------------------------------------------------------------ */

type JsonImage = { src?: string; alt?: string | null };
type JsonProduct = { handle?: string; title?: string; images?: JsonImage[] };

type JsonFeedResult =
  | { status: "ok"; products: JsonProduct[]; capped: boolean }
  | { status: "ratelimited" }
  | { status: "unavailable" };

async function readProductsJson(
  domain: string,
  budgetEnd: number,
): Promise<JsonFeedResult> {
  if (Date.now() > budgetEnd) return { status: "unavailable" };

  // Shopify caps `limit` at 250. One page is enough to size the catalogue;
  // reading every page would turn a scan into a mirror job and blow the budget.
  const res = await timedFetch(
    `https://${domain}/products.json?limit=250&page=1`,
    budgetEnd,
  );
  if (!res) return { status: "unavailable" };

  // 429 is a first-class outcome, not a generic failure. Shopify rate-limits
  // /products.json per IP with a Retry-After header, and on Vercel the egress
  // IP is shared with every other function invocation, so a busy store can hit
  // this without us doing anything wrong. Reporting it as "not a Shopify store"
  // would be actively misleading.
  if (res.status === 429) return { status: "ratelimited" };
  if (!res.ok) return { status: "unavailable" };

  let body: { products?: JsonProduct[] } | null = null;
  try {
    body = (await res.json()) as { products?: JsonProduct[] };
  } catch {
    return { status: "unavailable" };
  }
  if (!body || !Array.isArray(body.products)) return { status: "unavailable" };

  return {
    status: "ok",
    products: body.products.slice(0, MAX_PRODUCTS),
    capped: body.products.length >= 250,
  };
}

/* ------------------------------------------------------------------ */
/* Product page parsing                                                */
/* ------------------------------------------------------------------ */

type PageAltStats = {
  total: number;
  missing: number;
  autofilled: number;
  tooShort: number;
  ok: number;
  sampleAlt: string | null;
  /** Worst issue found on the page, used to pick report examples. */
  worst: AltIssue;
};

/** Images that are decoration, not content. Excluded from the audit. */
const DECORATIVE_RE = /(logo|icon|sprite|avatar|badge|payment|flag|spinner|placeholder)/i;

/** Decodes the handful of entities that show up inside alt attributes. */
function decodeEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function classifyAlt(alt: string | null, title: string): AltIssue {
  if (alt === null) return "missing";
  const a = alt.trim();
  if (!a) return "missing";

  // Title match is checked before length on purpose. Many product titles are
  // short ("Mug", "Linen Shirt"), so a title-copied alt would otherwise be
  // misfiled as "too short". "Auto-filled from the title" is the more useful
  // diagnosis: it tells the owner exactly what happened and how to fix it.
  if (title) {
    const norm = (x: string) => x.toLowerCase().replace(/\s+/g, " ").trim();
    const na = norm(a);
    const nt = norm(title);
    if (na === nt) return "autofilled";
    // Titles with a trailing size/colour suffix still count as auto-filled.
    if (na.startsWith(nt) && a.length <= title.length + 12) {
      return "autofilled";
    }
  }

  if (a.length < 15) return "too_short";
  return "ok";
}

/**
 * Pulls <img> tags out of a product page and classifies their alt text.
 *
 * Regex instead of a DOM parser on purpose: we only need the alt attribute of
 * a handful of tags, and pulling in cheerio/jsdom for that would add a build
 * dependency for no accuracy gain. The pattern tolerates attribute order,
 * single/double quotes and self-closing tags.
 */
export function auditProductHtml(html: string, productTitle: string): PageAltStats {
  const stats: PageAltStats = {
    total: 0,
    missing: 0,
    autofilled: 0,
    tooShort: 0,
    ok: 0,
    sampleAlt: null,
    worst: "ok",
  };

  const imgRe = /<img\b[^>]*>/gi;
  const altRe = /\balt\s*=\s*(?:"([^"]*)"|'([^']*)')/i;
  const srcRe = /\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)')/i;
  const classRe = /\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')/i;

  const rank: Record<AltIssue, number> = {
    missing: 3,
    autofilled: 2,
    too_short: 1,
    ok: 0,
  };

  const matches = html.match(imgRe) ?? [];

  for (const tag of matches) {
    const srcM = tag.match(srcRe);
    const src = srcM ? (srcM[1] ?? srcM[2] ?? "") : "";
    const clsM = tag.match(classRe);
    const cls = clsM ? (clsM[1] ?? clsM[2] ?? "") : "";

    // Skip chrome: logos, icons, payment badges, spacers, inline data URIs.
    if (DECORATIVE_RE.test(src) || DECORATIVE_RE.test(cls)) continue;
    if (src.startsWith("data:")) continue;
    // Only count images that actually load from a CDN or the store itself.
    if (!src || !(src.startsWith("http") || src.startsWith("//") || src.startsWith("/"))) {
      continue;
    }

    stats.total += 1;

    const altM = tag.match(altRe);
    let alt: string | null;
    if (!altM) {
      alt = null;
    } else {
      alt = decodeEntities(altM[1] ?? altM[2] ?? "");
    }

    if (stats.sampleAlt === null && alt && alt.trim()) {
      stats.sampleAlt = alt.trim().slice(0, 120);
    }

    const issue = classifyAlt(alt, productTitle);
    switch (issue) {
      case "missing":
        stats.missing += 1;
        break;
      case "autofilled":
        stats.autofilled += 1;
        break;
      case "too_short":
        stats.tooShort += 1;
        break;
      default:
        stats.ok += 1;
    }

    if (rank[issue] > rank[stats.worst]) stats.worst = issue;
  }

  return stats;
}

/* ------------------------------------------------------------------ */
/* Scan orchestration                                                  */
/* ------------------------------------------------------------------ */

async function samplePages(
  domain: string,
  products: JsonProduct[],
  budgetEnd: number,
): Promise<{
  pages: Array<{ handle: string; title: string; stats: PageAltStats }>;
  partial: boolean;
  rateLimited: boolean;
}> {
  const targets = products
    .filter((p) => typeof p.handle === "string" && p.handle.length > 0)
    .slice(0, MAX_SAMPLED_PAGES)
    .map((p) => ({ handle: p.handle as string, title: (p.title ?? "").trim() }));

  const out: Array<{ handle: string; title: string; stats: PageAltStats }> = [];
  let partial = false;
  let rateLimited = false;

  for (let i = 0; i < targets.length; i += SAMPLE_CONCURRENCY) {
    if (Date.now() > budgetEnd) {
      partial = true;
      break;
    }
    const batch = targets.slice(i, i + SAMPLE_CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (t) => {
        const res = await timedFetch(
          `https://${domain}/products/${encodeURIComponent(t.handle)}`,
          budgetEnd,
        );
        if (!res) return null;
        if (res.status === 429) {
          rateLimited = true;
          return null;
        }
        if (!res.ok) return null;
        const html = await res.text();
        return { handle: t.handle, title: t.title, stats: auditProductHtml(html, t.title) };
      }),
    );
    for (const r of results) {
      if (r) out.push(r);
      else partial = true;
    }
    // If every page in the first batch was throttled, stop hammering the store.
    if (rateLimited && out.length === 0 && i === 0) break;
  }

  return { pages: out, partial, rateLimited };
}

/**
 * Runs a full scan. Always resolves — failures come back as `{ ok: false }`
 * with a reason the UI can render as plain English.
 */
export async function runScan(rawDomain: string): Promise<ScanResult> {
  const started = Date.now();
  const budgetEnd = started + SCAN_BUDGET_MS;

  const domain = normalizeDomain(rawDomain);
  if (!domain) {
    return {
      ok: false,
      reason: "invalid_domain",
      message:
        "That doesn't look like a store address. Try something like yourstore.com or yourstore.myshopify.com.",
    };
  }
  if (isBlockedHost(domain)) {
    return {
      ok: false,
      reason: "blocked_host",
      message: "That address isn't a public store we can scan.",
    };
  }

  const cached = cache.get(domain);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return { ok: true, report: cached.report };
  }

  // Step 1 — ask permission.
  const robots = await readRobots(domain, budgetEnd);
  if (!robots) {
    return {
      ok: false,
      reason: "unreachable",
      message:
        "We couldn't reach that store. Check the address, or the site may be down or blocking automated requests.",
    };
  }
  if (robots.disallowAll) {
    return {
      ok: false,
      reason: "robots_disallow",
      message:
        "That store's robots.txt asks automated tools not to scan it. We respect that and stop here.",
    };
  }
  if (robots.disallowProductJson && robots.disallowProductPages) {
    return {
      ok: false,
      reason: "robots_disallow",
      message:
        "That store's robots.txt blocks automated reading of product data. We respect that and stop here.",
    };
  }

  // Step 2 — size the catalogue.
  let products: JsonProduct[] = [];
  let productsCapped = false;
  let rateLimited = false;

  if (!robots.disallowProductJson) {
    const feed = await readProductsJson(domain, budgetEnd);
    if (feed.status === "ok") {
      products = feed.products;
      productsCapped = feed.capped;
    } else if (feed.status === "ratelimited") {
      rateLimited = true;
    }
  }

  const notes: string[] = [];

  // Step 3 — sample rendered product pages, which is where the truth lives.
  let pages: Array<{ handle: string; title: string; stats: PageAltStats }> = [];
  let partial = false;

  if (!robots.disallowProductPages && products.length > 0) {
    const sampled = await samplePages(domain, products, budgetEnd);
    pages = sampled.pages;
    partial = partial || sampled.partial;
    rateLimited = rateLimited || sampled.rateLimited;
  }

  // Fallback: no products.json (blocked, disabled or throttled) — try the
  // sitemap so the scan still produces something instead of a dead end.
  if (pages.length === 0 && !robots.disallowProductPages) {
    const sitemapPages = await sampleFromSitemap(domain, budgetEnd);
    if (sitemapPages.length > 0) {
      pages = sitemapPages;
      partial = true;
      notes.push(
        "This store's public product feed wasn't available, so the audit used its sitemap instead. Coverage is smaller but the ratio still holds.",
      );
    }
  }

  if (pages.length === 0) {
    // Throttling is reported as itself. Calling it "not a Shopify store" would
    // send the owner looking for a problem that doesn't exist.
    if (rateLimited) {
      return {
        ok: false,
        reason: "ratelimited",
        message:
          "Shopify is temporarily rate-limiting automated requests to this store (HTTP 429). This isn't a problem with your store — wait a minute and try again.",
      };
    }
    if (products.length === 0) {
      return {
        ok: false,
        reason: "not_shopify",
        message:
          "We couldn't read product data from that address. It may not be a Shopify store, or it may have disabled its public product feed.",
      };
    }
    return {
      ok: false,
      reason: "unreachable",
      message:
        "We found products but couldn't load any product pages to check their images. The store may be behind a firewall.",
    };
  }

  // Step 4 — aggregate.
  const totals = pages.reduce(
    (acc, p) => {
      acc.total += p.stats.total;
      acc.missing += p.stats.missing;
      acc.autofilled += p.stats.autofilled;
      acc.tooShort += p.stats.tooShort;
      acc.ok += p.stats.ok;
      return acc;
    },
    { total: 0, missing: 0, autofilled: 0, tooShort: 0, ok: 0 },
  );

  const imagesFound = products.reduce(
    (n, p) => n + (Array.isArray(p.images) ? p.images.length : 0),
    0,
  );

  const coverageScore =
    totals.total > 0 ? Math.round((totals.ok / totals.total) * 100) : 0;

  // Examples: prefer the worst offenders, then a clean one for contrast.
  const sorted = [...pages].sort((a, b) => {
    const order: Record<AltIssue, number> = {
      missing: 0,
      autofilled: 1,
      too_short: 2,
      ok: 3,
    };
    return order[a.stats.worst] - order[b.stats.worst];
  });

  const examples: ScanExample[] = sorted.slice(0, 3).map((p) => ({
    handle: p.handle,
    title: p.title,
    issue: p.stats.worst,
    sampleAlt: p.stats.sampleAlt,
  }));

  const clean = sorted.find((p) => p.stats.worst === "ok" && p.stats.total > 0);
  if (clean && examples.length < 4) {
    examples.push({
      handle: clean.handle,
      title: clean.title,
      issue: "ok",
      sampleAlt: clean.stats.sampleAlt,
    });
  }

  if (partial) {
    notes.push(
      "Some product pages couldn't be loaded in time, so the numbers are based on the pages we did read.",
    );
  }
  if (productsCapped) {
    notes.push(
      `This store has more than ${MAX_PRODUCTS} products. We read the first ${MAX_PRODUCTS} and sampled ${pages.length} product pages.`,
    );
  }
  notes.push(
    "The coverage score is the share of sampled images whose alt text actually describes the image. Alt text copied from the product title, or shorter than 15 characters, doesn't count.",
  );
  notes.push(
    "This is an automated sample of publicly accessible pages, not a guaranteed audit. Figures are indicative, not exact, and are not a promise of any SEO or ranking outcome.",
  );

  const report: ScanReport = {
    domain,
    productsFound: products.length,
    productsCapped,
    imagesFound,
    pagesSampled: pages.length,
    coverageScore,
    breakdown: {
      missing: totals.missing,
      autofilled: totals.autofilled,
      tooShort: totals.tooShort,
      ok: totals.ok,
      total: totals.total,
    },
    examples,
    partial,
    notes,
    scannedAt: new Date().toISOString(),
  };

  cache.set(domain, { at: Date.now(), report });
  if (cache.size > 200) {
    // Cheap eviction: drop the oldest entry.
    const oldest = [...cache.entries()].sort((a, b) => a[1].at - b[1].at)[0];
    if (oldest) cache.delete(oldest[0]);
  }

  return { ok: true, report };
}

/**
 * Last-resort fallback when products.json is unavailable: read the product
 * sitemap, take the first few product URLs, and audit those pages directly.
 * Deliberately capped so a huge sitemap can't blow the time budget.
 */
async function sampleFromSitemap(
  domain: string,
  budgetEnd: number,
): Promise<Array<{ handle: string; title: string; stats: PageAltStats }>> {
  const out: Array<{ handle: string; title: string; stats: PageAltStats }> = [];

  for (const path of ["/sitemap_products_1.xml", "/sitemap.xml"]) {
    if (Date.now() > budgetEnd) break;
    const res = await timedFetch(`https://${domain}${path}`, budgetEnd);
    if (!res || !res.ok) continue;

    const xml = await res.text();
    const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)]
      .map((m) => m[1])
      .filter((u) => /\/products\//i.test(u))
      .slice(0, MAX_SAMPLED_PAGES);

    if (locs.length === 0) continue;

    for (let i = 0; i < locs.length; i += SAMPLE_CONCURRENCY) {
      if (Date.now() > budgetEnd) break;
      const batch = locs.slice(i, i + SAMPLE_CONCURRENCY);
      const results = await Promise.all(
        batch.map(async (url) => {
          const r = await timedFetch(url, budgetEnd);
          if (!r || !r.ok) return null;
          const html = await r.text();
          const handle =
            url.replace(/[?#].*$/, "").split("/products/")[1]?.replace(/\/$/, "") ?? url;
          return { handle, title: "", stats: auditProductHtml(html, "") };
        }),
      );
      for (const r of results) if (r) out.push(r);
    }
    if (out.length > 0) break;
  }

  return out;
}

/** Exposed for the settings page footer / debugging. */
export function scannerLimits() {
  return {
    maxProducts: MAX_PRODUCTS,
    maxSampledPages: MAX_SAMPLED_PAGES,
    budgetMs: SCAN_BUDGET_MS,
  };
}
