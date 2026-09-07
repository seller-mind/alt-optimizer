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

export default function TermsPage() {
  const { lastUpdated } = useLoaderData<typeof loader>();

  return (
    <div style={s.page}>
      <h1 style={s.h1}>Terms of Service</h1>
      <p style={s.sub}>Last updated: {lastUpdated}</p>
      <div style={s.card}>
        <h2 style={s.h2}>Terms of Service for AltOptimizer</h2>

        <h3 style={s.h3}>1. Acceptance of Terms</h3>
        <p style={s.p}>By installing and using AltOptimizer (the &quot;App&quot;), you agree to these Terms of Service. If you do not agree, do not install or use the App.</p>

        <h3 style={s.h3}>2. Description of Service</h3>
        <p style={s.p}>AltOptimizer is a free AI-powered tool that generates SEO-optimized alt text, product tags, and JSON-LD structured data for Shopify product images. The App uses advanced AI vision models to analyze product images and generate descriptive content.</p>

        <h3 style={s.h3}>3. Free Service and Usage Limits</h3>
        <p style={s.p}>• The App is provided free of charge</p>
        <p style={s.p}>• Free usage includes a monthly quota of 50 content generations (alt text, tags, or JSON-LD combined)</p>
        <p style={s.p}>• Usage counts reset automatically at the start of each calendar month</p>
        <p style={s.p}>• Exceeding the monthly quota will temporarily prevent further generations until the next reset</p>

        <h3 style={s.h3}>4. Acceptable Use</h3>
        <p style={s.p}>You agree to use the App only for lawful purposes and in accordance with Shopify&apos;s Terms of Service. You may not:</p>
        <p style={s.p}>• Use the App to generate content that violates any applicable laws</p>
        <p style={s.p}>• Attempt to circumvent quota limits</p>
        <p style={s.p}>• Reverse engineer or modify the App&apos;s code</p>

        <h3 style={s.h3}>5. Limitation of Liability</h3>
        <p style={s.p}>The App is provided &quot;as is&quot; without warranty of any kind. The developer shall not be liable for any damages arising from the use or inability to use the App, including but not limited to:</p>
        <p style={s.p}>• AI-generated content accuracy (always review before applying)</p>
        <p style={s.p}>• Service interruptions or downtime</p>

        <h3 style={s.h3}>6. Data Handling</h3>
        <p style={s.p}>• Product images are sent to our AI service provider for analysis. See our Privacy Policy for details.</p>
        <p style={s.p}>• We implement reasonable security measures to protect your data</p>
        <p style={s.p}>• You can delete all your data at any time from the app&apos;s Settings page</p>

        <h3 style={s.h3}>7. Changes to Terms</h3>
        <p style={s.p}>We reserve the right to modify these terms at any time. You will be notified of material changes via the App or email.</p>

        <h3 style={s.h3}>8. Contact</h3>
        <p style={s.p}>For questions about these terms, please contact the app developer through the Shopify App Store.</p>
      </div>
    </div>
  );
}
