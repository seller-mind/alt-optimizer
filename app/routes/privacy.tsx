import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Card, Text, BlockStack } from "@shopify/polaris";

export const loader = async () => {
  return json({ lastUpdated: "2026-08-29" });
};

export default function PrivacyPage() {
  const { lastUpdated } = useLoaderData<typeof loader>();

  return (
    <Page title="Privacy Policy" subtitle={`Last updated: ${lastUpdated}`}>
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">Privacy Policy for AltOptimizer</Text>

          <Text as="h3" variant="headingSm">1. What Data We Collect</Text>
          <Text as="p" variant="bodyMd">
            AltOptimizer collects and processes the following data from your Shopify store:
          </Text>
          <Text as="p" variant="bodyMd">
            • Product data: titles, descriptions, handles, and image information
          </Text>
          <Text as="p" variant="bodyMd">
            • Product images: for AI analysis and alt text generation
          </Text>
          <Text as="p" variant="bodyMd">
            • Generated content: AI-generated alt text, product tags, and JSON-LD structured data
          </Text>
          <Text as="p" variant="bodyMd">
            • Usage metrics: number of images processed per month for quota tracking
          </Text>

          <Text as="h3" variant="headingSm">2. What We Do NOT Collect</Text>
          <Text as="p" variant="bodyMd">
            AltOptimizer does NOT collect:
          </Text>
          <Text as="p" variant="bodyMd">
            • Customer data (names, emails, addresses, payment information)
          </Text>
          <Text as="p" variant="bodyMd">
            • Order information or transaction data
          </Text>
          <Text as="p" variant="bodyMd">
            • Personal identifiable information of store visitors
          </Text>
          <Text as="p" variant="bodyMd">
            • Analytics or browsing behavior of store visitors
          </Text>

          <Text as="h3" variant="headingSm">3. How We Use Your Data</Text>
          <Text as="p" variant="bodyMd">
            • Product images are sent to our secure AI service for image analysis to generate descriptive alt text
          </Text>
          <Text as="p" variant="bodyMd">
            • Product titles and descriptions are used to generate relevant tags and structured data
          </Text>
          <Text as="p" variant="bodyMd">
            • Usage data is tracked to enforce the monthly generation quota
          </Text>

          <Text as="h3" variant="headingSm">4. Data Storage and Retention</Text>
          <Text as="p" variant="bodyMd">
            • Your data is stored securely in our database while the app is installed
          </Text>
          <Text as="p" variant="bodyMd">
            • After uninstalling the app, your data is retained for 30 days (grace period) and then permanently deleted
          </Text>
          <Text as="p" variant="bodyMd">
            • You can request immediate data deletion at any time from the app's Settings page
          </Text>

          <Text as="h3" variant="headingSm">5. Data Sharing</Text>
          <Text as="p" variant="bodyMd">
            • Product images are sent to our AI service provider for image analysis. The service is used solely for generating alt text and related content.
          </Text>
          <Text as="p" variant="bodyMd">
            • We do not sell, trade, or share your data with any other third parties
          </Text>

          <Text as="h3" variant="headingSm">6. Contact</Text>
          <Text as="p" variant="bodyMd">
            For privacy-related inquiries or data deletion requests, please contact the app developer through the Shopify App Store.
          </Text>
        </BlockStack>
      </Card>
    </Page>
  );
}
