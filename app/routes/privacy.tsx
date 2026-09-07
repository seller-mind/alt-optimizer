import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export const loader = async () => {
  return json({ lastUpdated: "2026-08-29" });
};

const s = {
  page: { maxWidth: 800, margin: "0 auto", padding: "40px 20px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: "#202223" } as React.CSSProperties,
  h1: { fontSize: 28, fontWeight: 600, marginBottom: 4 } as React.CSSProperties,
  sub: { color: "#666", fontSize: 14, marginBottom: 32 } as React.CSSProperties,
  card: { background: "#fff", border: "1px solid #e1e3e5", borderRadius: 8, padding: 24 } as React.CSSProperties,
  h2: { fontSize: 20, fontWeight: 600, marginTop: 24, marginBottom: 8 } as React.CSSProperties,
  h3: { fontSize: 16, fontWeight: 600, marginTop: 16, marginBottom: 6 } as React.CSSProperties,
  p: { fontSize: 14, lineHeight: 1.6, marginBottom: 8, color: "#444" } as React.CSSProperties,
};

export default function PrivacyPage() {
  const { lastUpdated } = useLoaderData<typeof loader>();

  return (
    <div style={s.page}>
      <h1 style={s.h1}>Privacy Policy</h1>
      <p style={s.sub}>Last updated: {lastUpdated}</p>
      <div style={s.card}>
        <h2 style={s.h2}>Privacy Policy for AltOptimizer</h2>

        <h3 style={s.h3}>1. What Data We Collect</h3>
        <p style={s.p}>AltOptimizer collects and processes the following data from your Shopify store:</p>
        <p style={s.p}>• Product data: titles, descriptions, handles, and image information</p>
        <p style={s.p}>• Product images: for AI analysis and alt text generation</p>
        <p style={s.p}>• Generated content: AI-generated alt text, product tags, and JSON-LD structured data</p>
        <p style={s.p}>• Usage metrics: number of images processed per month for quota tracking</p>

        <h3 style={s.h3}>2. What We Do NOT Collect</h3>
        <p style={s.p}>AltOptimizer does NOT collect:</p>
        <p style={s.p}>• Customer data (names, emails, addresses, payment information)</p>
        <p style={s.p}>• Order information or transaction data</p>
        <p style={s.p}>• Personal identifiable information of store visitors</p>
        <p style={s.p}>• Analytics or browsing behavior of store visitors</p>

        <h3 style={s.h3}>3. How We Use Your Data</h3>
        <p style={s.p}>• Product images are sent to our secure AI service for image analysis to generate descriptive alt text</p>
        <p style={s.p}>• Product titles and descriptions are used to generate relevant tags and structured data</p>
        <p style={s.p}>• Usage data is tracked to enforce the monthly generation quota</p>

        <h3 style={s.h3}>4. Data Storage and Retention</h3>
        <p style={s.p}>• Your data is stored securely in our database while the app is installed</p>
        <p style={s.p}>• After uninstalling the app, your data is retained for 30 days (grace period) and then permanently deleted</p>
        <p style={s.p}>• You can request immediate data deletion at any time from the app&apos;s Settings page</p>

        <h3 style={s.h3}>5. Data Sharing</h3>
        <p style={s.p}>• Product images are sent to our AI service provider for image analysis. The service is used solely for generating alt text and related content.</p>
        <p style={s.p}>• We do not sell, trade, or share your data with any other third parties</p>

        <h3 style={s.h3}>6. Contact</h3>
        <p style={s.p}>For privacy-related inquiries or data deletion requests, please contact the app developer through the Shopify App Store.</p>
      </div>
    </div>
  );
}
