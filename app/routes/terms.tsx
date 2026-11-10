import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export const loader = async () => {
  return json({ lastUpdated: "2026-11-10" });
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
        <p style={s.p}>By installing and using AltOptimizer (the &quot;App&quot;), or by using the free Alt Text Scanner (the &quot;Scanner&quot;), you agree to these Terms of Service. If you do not agree, do not install the App and do not use the Scanner.</p>

        <h3 style={s.h3}>2. Description of Service</h3>
        <p style={s.p}>AltOptimizer is a free AI-powered tool that generates SEO-optimized alt text, product tags, and JSON-LD structured data for Shopify product images. The App uses advanced AI vision models to analyze product images and generate descriptive content.</p>

        <h3 style={s.h3}>3. The Free Alt Text Scanner</h3>
        <p style={s.p}>The Scanner is a separate, free, publicly accessible tool that reports on alt text coverage for a Shopify storefront. It is not part of the App, requires no installation, and requires no Shopify account connection.</p>
        <p style={s.p}>• The Scanner only reads publicly accessible pages of the store you enter, and it honours that store&apos;s robots.txt. If the store disallows automated access, the scan stops.</p>
        <p style={s.p}>• Scan results are indicative estimates derived from a sample of publicly accessible product pages. They are not a complete audit, and the numbers shown are approximate rather than exact.</p>
        <p style={s.p}>• The Scanner does not guarantee, promise, or predict any SEO outcome, search ranking, traffic, conversion rate, or revenue result. It reports observations only.</p>
        <p style={s.p}>• The Scanner is provided free of charge and &quot;as is&quot;, with no warranty of accuracy, availability, or fitness for a particular purpose.</p>
        <p style={s.p}>• You may only scan stores that you own, operate, or have permission to scan. You may not use the Scanner to probe, overload, attack, or extract data from stores you have no right to access.</p>
        <p style={s.p}>• You may not automate, script, or resell access to the Scanner, or use it to build a competing dataset.</p>

        <h3 style={s.h3}>4. Free Service and Usage Limits</h3>
        <p style={s.p}>• The App is provided free of charge</p>
        <p style={s.p}>• Free usage includes a monthly quota of 50 content generations (alt text, tags, or JSON-LD combined)</p>
        <p style={s.p}>• Usage counts reset automatically at the start of each calendar month</p>
        <p style={s.p}>• Exceeding the monthly quota will temporarily prevent further generations until the next reset</p>

        <h3 style={s.h3}>5. Acceptable Use</h3>
        <p style={s.p}>You agree to use the App and the Scanner only for lawful purposes and in accordance with Shopify&apos;s Terms of Service. You may not:</p>
        <p style={s.p}>• Use the App or the Scanner to generate content that violates any applicable laws</p>
        <p style={s.p}>• Attempt to circumvent quota limits, rate limits, or the robots.txt checks described above</p>
        <p style={s.p}>• Reverse engineer or modify the App&apos;s or the Scanner&apos;s code</p>
        <p style={s.p}>• Use the Scanner against stores you do not own or have permission to scan</p>

        <h3 style={s.h3}>6. Limitation of Liability</h3>
        <p style={s.p}>The App and the Scanner are provided &quot;as is&quot; without warranty of any kind. The developer shall not be liable for any damages arising from the use or inability to use the App or the Scanner, including but not limited to:</p>
        <p style={s.p}>• AI-generated content accuracy (always review before applying)</p>
        <p style={s.p}>• The accuracy or completeness of any Scanner report, including any sampling error</p>
        <p style={s.p}>• Any decision made on the basis of a Scanner report</p>
        <p style={s.p}>• Service interruptions or downtime</p>

        <h3 style={s.h3}>7. Data Handling</h3>
        <p style={s.p}>• Product images are sent to our AI service provider for analysis. See our Privacy Policy for details.</p>
        <p style={s.p}>• The Scanner does not store the data of the stores it reads. See our Privacy Policy for details.</p>
        <p style={s.p}>• We implement reasonable security measures to protect your data</p>
        <p style={s.p}>• You can delete all your data at any time from the app&apos;s Settings page</p>

        <h3 style={s.h3}>8. Changes to Terms</h3>
        <p style={s.p}>We reserve the right to modify these terms at any time. You will be notified of material changes via the App or email.</p>

        <h3 style={s.h3}>9. Contact</h3>
        <p style={s.p}>For questions about these terms, please contact the app developer through the Shopify App Store.</p>
      </div>
    </div>
  );
}
