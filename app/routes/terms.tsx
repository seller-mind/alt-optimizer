import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Card, Text, BlockStack } from "@shopify/polaris";

export const loader = async () => {
  return json({ lastUpdated: "2024-01-01" });
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
            AltOptimizer is an AI-powered tool that generates SEO-optimized alt text, product tags, and JSON-LD structured data for Shopify product images. The App uses OpenAI's GPT-4o API to analyze product images and generate descriptive content.
          </Text>

          <Text as="h3" variant="headingSm">3. Subscription and Billing</Text>
          <Text as="p" variant="bodyMd">
            • The App offers multiple subscription plans as described on the pricing page
          </Text>
          <Text as="p" variant="bodyMd">
            • All plans are billed through Shopify's billing system on a recurring 30-day basis
          </Text>
          <Text as="p" variant="bodyMd">
            • You can upgrade, downgrade, or cancel your subscription at any time
          </Text>
          <Text as="p" variant="bodyMd">
            • Downgrading takes effect at the next billing cycle
          </Text>
          <Text as="p" variant="bodyMd">
            • No refunds are provided for partial billing periods
          </Text>

          <Text as="h3" variant="headingSm">4. Usage Limits</Text>
          <Text as="p" variant="bodyMd">
            • Each plan has a monthly quota of image generations as specified on the pricing page
          </Text>
          <Text as="p" variant="bodyMd">
            • Usage resets at the start of each billing cycle
          </Text>
          <Text as="p" variant="bodyMd">
            • Exceeding your quota will prevent further generations until the next cycle or plan upgrade
          </Text>

          <Text as="h3" variant="headingSm">5. Acceptable Use</Text>
          <Text as="p" variant="bodyMd">
            You agree to use the App only for lawful purposes and in accordance with Shopify's Terms of Service. You may not:
          </Text>
          <Text as="p" variant="bodyMd">
            • Use the App to generate content that violates any applicable laws
          </Text>
          <Text as="p" variant="bodyMd">
            • Attempt to circumvent quota limits or billing systems
          </Text>
          <Text as="p" variant="bodyMd">
            • Reverse engineer or modify the App's code
          </Text>

          <Text as="h3" variant="headingSm">6. Limitation of Liability</Text>
          <Text as="p" variant="bodyMd">
            The App is provided "as is" without warranty of any kind. The developer shall not be liable for any damages arising from the use or inability to use the App, including but not limited to:
          </Text>
          <Text as="p" variant="bodyMd">
            • Loss of data (backup your data regularly using the backup feature)
          </Text>
          <Text as="p" variant="bodyMd">
            • AI-generated content accuracy (always review before applying)
          </Text>
          <Text as="p" variant="bodyMd">
            • Service interruptions or downtime
          </Text>

          <Text as="h3" variant="headingSm">7. Data Handling</Text>
          <Text as="p" variant="bodyMd">
            • Product images are sent to OpenAI for AI analysis. See our Privacy Policy for details.
          </Text>
          <Text as="p" variant="bodyMd">
            • We implement reasonable security measures to protect your data
          </Text>
          <Text as="p" variant="bodyMd">
            • You can delete your data at any time from the Settings page
          </Text>

          <Text as="h3" variant="headingSm">8. Changes to Terms</Text>
          <Text as="p" variant="bodyMd">
            We reserve the right to modify these terms at any time. You will be notified of material changes via the App or email.
          </Text>

          <Text as="h3" variant="headingSm">9. Contact</Text>
          <Text as="p" variant="bodyMd">
            For questions about these terms, please contact the app developer through the Shopify App Store.
          </Text>
        </BlockStack>
      </Card>
    </Page>
  );
}