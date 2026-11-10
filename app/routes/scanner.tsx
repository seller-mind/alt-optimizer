import { json } from "@remix-run/node";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Form, useLoaderData, useNavigation } from "@remix-run/react";
import {
  Page,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  TextField,
  Banner,
  Badge,
  Divider,
  Box,
} from "@shopify/polaris";
import { runScan } from "~/lib/scanner.server";
import type { ScanReport } from "~/lib/scanner.server";

/**
 * /scanner — the free public alt-text audit.
 *
 * This is the top of the funnel: a store owner types their domain, waits a few
 * seconds, and gets a number. No install, no OAuth, no signup. The only thing
 * it asks for is a domain name that is already public.
 *
 * The scan itself lives in app/lib/scanner.server.ts, which documents the
 * robots.txt gate, the request caps and the no-persistence rule.
 */

export const meta: MetaFunction = () => [
  { title: "Free Alt Text Scanner for Shopify Stores — AltOptimizer" },
  {
    name: "description",
    content:
      "Scan any Shopify store in seconds and see how many product images are missing alt text. Free, no install, no signup, no login.",
  },
  { name: "robots", content: "index, follow" },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const domain = (url.searchParams.get("domain") || "").trim();

  if (!domain) {
    return json({ domain: "", result: null });
  }

  const result = await runScan(domain);
  return json({ domain, result });
};

/* ------------------------------------------------------------------ */
/* Presentation helpers                                                */
/* ------------------------------------------------------------------ */

const ISSUE_LABEL: Record<string, string> = {
  missing: "No alt text",
  autofilled: "Copied from product title",
  too_short: "Too short to describe the image",
  ok: "Describes the image",
};

const ISSUE_TONE: Record<string, "critical" | "warning" | "attention" | "success"> = {
  missing: "critical",
  autofilled: "warning",
  too_short: "attention",
  ok: "success",
};

function scoreTone(score: number): "critical" | "warning" | "success" {
  if (score < 40) return "critical";
  if (score < 70) return "warning";
  return "success";
}

function Bar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 14,
          marginBottom: 6,
        }}
      >
        <span style={{ color: "#202223" }}>{label}</span>
        <span style={{ color: "#6d7175", fontVariantNumeric: "tabular-nums" }}>
          {count} &nbsp;·&nbsp; {pct}%
        </span>
      </div>
      <div
        style={{
          height: 8,
          background: "#f1f2f3",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: 4,
          }}
        />
      </div>
    </div>
  );
}

function ReportView({ report }: { report: ScanReport }) {
  const { breakdown } = report;
  const tone = scoreTone(report.coverageScore);

  const heroColor =
    tone === "critical" ? "#d72c0d" : tone === "warning" ? "#b98900" : "#008060";

  const catalogueLine =
    report.imagesFound > 0
      ? `A catalogue of ${report.productsFound} products and ${report.imagesFound} images${
          report.productsCapped ? " (first 250 products only)" : ""
        }.`
      : `A catalogue of ${report.productsFound} products.`;

  return (
    <BlockStack gap="500">
      {/* Score */}
      <Card>
        <BlockStack gap="300">
          <Text as="p" variant="bodySm" tone="subdued">
            {report.domain}
          </Text>
          <InlineStack gap="600" blockAlign="center" wrap={false}>
            <div>
              <div
                style={{
                  fontSize: 64,
                  fontWeight: 650,
                  lineHeight: 1,
                  color: heroColor,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {report.coverageScore}
                <span style={{ fontSize: 24, color: "#8c9196" }}>/100</span>
              </div>
              <Text as="p" variant="bodySm" tone="subdued">
                Alt text coverage score
              </Text>
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <Text as="p" variant="bodyMd">
                {catalogueLine}
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                We opened {report.pagesSampled} product pages and looked at{" "}
                {breakdown.total} images on them.
              </Text>
            </div>
          </InlineStack>
        </BlockStack>
      </Card>

      {/* Breakdown */}
      <Card>
        <BlockStack gap="300">
          <Text as="h2" variant="headingMd">
            What we found
          </Text>
          <Bar
            label="No alt text at all"
            count={breakdown.missing}
            total={breakdown.total}
            color="#d72c0d"
          />
          <Bar
            label="Copied from the product title"
            count={breakdown.autofilled}
            total={breakdown.total}
            color="#b98900"
          />
          <Bar
            label="Too short to describe anything"
            count={breakdown.tooShort}
            total={breakdown.total}
            color="#e0a800"
          />
          <Bar
            label="Actually describes the image"
            count={breakdown.ok}
            total={breakdown.total}
            color="#008060"
          />
        </BlockStack>
      </Card>

      {/* Examples */}
      {report.examples.length > 0 && (
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">
              Examples from your store
            </Text>
            <BlockStack gap="200">
              {report.examples.map((ex) => (
                <Box
                  key={`${ex.handle}-${ex.issue}`}
                  padding="300"
                  background="bg-surface-secondary"
                  borderRadius="200"
                >
                  <BlockStack gap="100">
                    <InlineStack gap="200" blockAlign="center">
                      <Text as="span" variant="bodyMd" fontWeight="semibold">
                        /products/{ex.handle}
                      </Text>
                      <Badge tone={ISSUE_TONE[ex.issue]}>
                        {ISSUE_LABEL[ex.issue]}
                      </Badge>
                    </InlineStack>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {ex.issue === "missing"
                        ? "alt=\"\" — a screen reader and a crawler both get nothing."
                        : ex.sampleAlt
                          ? `alt="${ex.sampleAlt}"`
                          : "No alt attribute found on the images we read."}
                    </Text>
                  </BlockStack>
                </Box>
              ))}
            </BlockStack>
          </BlockStack>
        </Card>
      )}

      {/* CTA */}
      <Card>
        <BlockStack gap="300">
          <Text as="h2" variant="headingMd">
            Want these written for you?
          </Text>
          <Text as="p" variant="bodyMd">
            AltOptimizer looks at each image and writes alt text that describes
            what is actually in it — not a copy of the product title. You review
            before anything is applied, and every change can be rolled back.
          </Text>
          <InlineStack gap="300">
            <Button variant="primary" url="/install">
              Install on Shopify
            </Button>
            <Text as="span" variant="bodySm" tone="subdued">
              Free for 50 images a month
            </Text>
          </InlineStack>
        </BlockStack>
      </Card>

      {/* Caveats — required reading, not fine print */}
      <Card>
        <BlockStack gap="200">
          <Text as="h3" variant="headingSm">
            How to read this
          </Text>
          {report.notes.map((n, i) => (
            <Text as="p" variant="bodySm" tone="subdued" key={i}>
              • {n}
            </Text>
          ))}
          <Divider />
          <Text as="p" variant="bodySm" tone="subdued">
            This tool only reads pages that are already public, and it honours
            your store&apos;s robots.txt. Nothing about your store is stored — the
            report exists only in your browser.
          </Text>
        </BlockStack>
      </Card>
    </BlockStack>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function ScannerPage() {
  const { domain, result } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isScanning = navigation.state === "loading";

  return (
    <Page>
      <BlockStack gap="600">
        {/* Hero */}
        <div style={{ paddingTop: 8 }}>
          <Text as="h1" variant="heading2xl">
            How many of your product images can AI actually read?
          </Text>
          <div style={{ marginTop: 8, maxWidth: 640 }}>
            <Text as="p" variant="bodyLg" tone="subdued">
              Enter your store address. In a few seconds you get a coverage
              score, a breakdown of what&apos;s missing, and real examples from
              your own catalogue.
            </Text>
          </div>
        </div>

        {/* Input */}
        <Card>
          <Form method="get">
            <BlockStack gap="300">
              <InlineStack gap="300" blockAlign="end" wrap={false}>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <TextField
                    label="Store domain"
                    labelHidden
                    name="domain"
                    placeholder="yourstore.com or yourstore.myshopify.com"
                    defaultValue={domain}
                    autoComplete="off"
                    helpText="No install, no login, no access to your Shopify admin. Just the public storefront."
                  />
                </div>
                <Button submit variant="primary" loading={isScanning}>
                  {isScanning ? "Scanning…" : "Scan my store"}
                </Button>
              </InlineStack>
              {isScanning && (
                <Text as="p" variant="bodySm" tone="subdued">
                  Reading robots.txt, counting products, and sampling product
                  pages. This takes a few seconds.
                </Text>
              )}
            </BlockStack>
          </Form>
        </Card>

        {/* Results */}
        {result && !result.ok && (
          <Banner tone="warning" title="Couldn't scan that store">
            <p>{result.message}</p>
          </Banner>
        )}

        {result && result.ok && <ReportView report={result.report} />}

        {/* What this is, for people who land here cold */}
        {!result && (
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                Why alt text matters
              </Text>
              <Text as="p" variant="bodyMd">
                Alt text is the only thing a search engine, a screen reader, or
                an AI shopping assistant can read about an image. When it&apos;s
                missing or just a copy of the product title, the image is
                effectively invisible to them.
              </Text>
              <Text as="p" variant="bodyMd">
                Most Shopify stores have far more missing alt text than their
                owners expect. This scan tells you where you actually stand.
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                This scanner only reads publicly accessible pages, respects
                robots.txt, and stores nothing about your store.
              </Text>
            </BlockStack>
          </Card>
        )}
      </BlockStack>
    </Page>
  );
}
