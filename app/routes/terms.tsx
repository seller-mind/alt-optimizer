import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Card, Text, BlockStack } from "@shopify/polaris";

export const loader = async () => {
  return json({ lastUpdated: "2026-08-29" });
};

export default function TermsPage() {
  const { lastUpdated } = useLoaderData<typeof loader>();

  return (
    <Page title="Terms of Service" subtitle={`Last updated: ${lastUpdated}`}>
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">Terms of Service for AltOptimizer</Text>

          <Text as="h3" variant="headingSm">1. Acceptance of Terms</Text>
          <Text as="p" variant="bodyMd">
            By installing and using AltOptimizer (the "App"), you agree to these Terms of Service. If you do not agree, do not install or use the App.
          </Text>

          <Text as="h3" variant="headingSm">2. Description of Service</Text>
          <Text as="p" variant="bodyMd">
            AltOptimizer is a free AI-powered tool that generates SEO-optimized alt text, product tags, and JSON-LD structured data for Shopify product images. The App uses DeepSeek's AI API to analyze product images and generate descriptive content.
          </Text>

          <Text as="h3" variant="headingSm">3. Free Service and Usage Limits</Text>
          <Text as="p" variant="bodyMd">
            • The App is provided free of charge
          </Text>
          <Text as="p" variant="bodyMd">
            • Free usage includes a monthly quota of 50 content generations (alt text, tags, or JSON-LD combined)
          </Text>
          <Text as="p" variant="bodyMd">
            • Usage counts reset automatically at the start of each calendar month
          </Text>
          <Text as="p" variant="bodyMd">
            • Exceeding the monthly quota will temporarily prevent further generations until the next reset
          </Text>

          <Text as="h3" variant="headingSm">4. Acceptable Use</Text>
          <Text as="p" variant="bodyMd">
            You agree to use the App only for lawful purposes and in accordance with Shopify's Terms of Service. You may not:
          </Text>
          <Text as="p" variant="bodyMd">
            • Use the App to generate content that violates any applicable laws
          </Text>
          <Text as="p" variant="bodyMd">
            • Attempt to circumvent quota limits
          </Text>
          <Text as="p" variant="bodyMd">
            • Reverse engineer or modify the App's code
          </Text>

          <Text as="h3" variant="headingSm">5. Limitation of Liability</Text>
          <Text as="p" variant="bodyMd">
            The App is provided "as is" without warranty of any kind. The developer shall not be liable for any damages arising from the use or inability to use the App, including but not limited to:
          </Text>
          <Text as="p" variant="bodyMd">
            • AI-generated content accuracy (always review before applying)
          </Text>
          <Text as="p" variant="bodyMd">
            • Service interruptions or downtime
          </Text>

          <Text as="h3" variant="headingSm">6. Data Handling</Text>
          <Text as="p" variant="bodyMd">
            • Product images are sent to DeepSeek's API for AI analysis. See our Privacy Policy for details.
          </Text>
          <Text as="p" variant="bodyMd">
            • We implement reasonable security measures to protect your data
          </Text>
          <Text as="p" variant="bodyMd">
            • You can delete all your data at any time from the app's Settings page
          </Text>

          <Text as="h3" variant="headingSm">7. Changes to Terms</Text>
          <Text as="p" variant="bodyMd">
            We reserve the right to modify these terms at any time. You will be notified of material changes via the App or email.
          </Text>

          <Text as="h3" variant="headingSm">8. Contact</Text>
          <Text as="p" variant="bodyMd">
            For questions about these terms, please contact the app developer through the Shopify App Store.
          </Text>
        </BlockStack>
      </Card>
    </Page>
  );
}
