import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, useLoaderData, useActionData, useSubmit, useNavigation } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  BlockStack,
  InlineStack,
  Banner,
  DataTable,
  Badge,
  EmptyState,
} from "@shopify/polaris";
import { useCallback } from "react";
import { authenticate } from "~/shopify.server";
import prisma from "~/db.server";
import { createBackup, listBackups, restoreBackup, deleteBackup, exportToCsv } from "~/services/backup.server";
import { getOrCreateShop } from "~/utils/shop.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);

  const backups = await listBackups(shop.id);

  return {
    backups: backups.map((b) => ({
      id: b.id,
      createdAt: b.createdAt.toISOString(),
      recordCount: b.recordCount,
    })),
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "create") {
    const backup = await createBackup(shop.id);
    return json({
      success: true,
      message: `Backup created with ${backup.recordCount} image records.`,
    });
  }

  if (intent === "restore") {
    const backupId = parseInt(formData.get("backupId") as string, 10);
    const result = await restoreBackup(shop.id, backupId);
    return json({
      success: result.success,
      message: result.message,
    });
  }

  if (intent === "delete") {
    const backupId = parseInt(formData.get("backupId") as string, 10);
    await deleteBackup(shop.id, backupId);
    return json({ success: true, message: "Backup deleted." });
  }

  if (intent === "export") {
    const csv = await exportToCsv(shop.id);
    return json({ success: true, csv });
  }

  return json({ success: false, error: "Unknown action" });
};

export default function BackupPage() {
  const { backups } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isProcessing = navigation.state !== "idle";

  const handleCreate = useCallback(() => {
    const formData = new FormData();
    formData.set("intent", "create");
    submit(formData, { method: "post" });
  }, [submit]);

  const handleRestore = useCallback(
    (backupId: number) => {
      const formData = new FormData();
      formData.set("intent", "restore");
      formData.set("backupId", String(backupId));
      submit(formData, { method: "post" });
    },
    [submit]
  );

  const handleDelete = useCallback(
    (backupId: number) => {
      const formData = new FormData();
      formData.set("intent", "delete");
      formData.set("backupId", String(backupId));
      submit(formData, { method: "post" });
    },
    [submit]
  );

  const handleExport = useCallback(() => {
    const formData = new FormData();
    formData.set("intent", "export");
    submit(formData, { method: "post" });
  }, [submit]);

  const handleDownloadCsv = useCallback(() => {
    if (!actionData?.csv) return;
    const blob = new Blob([actionData.csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alt-optimizer-backup-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [actionData]);

  const rows = backups.map((backup) => [
    new Date(backup.createdAt).toLocaleString(),
    String(backup.recordCount),
    <InlineStack gap="100" key={backup.id}>
      <Button
        size="slim"
        onClick={() => handleRestore(backup.id)}
        disabled={isProcessing}
      >
        Restore
      </Button>
      <Button
        size="slim"
        tone="critical"
        variant="plain"
        onClick={() => handleDelete(backup.id)}
        disabled={isProcessing}
      >
        Delete
      </Button>
    </InlineStack>,
  ]);

  return (
    <Page
      title="Backup & Restore"
      subtitle="Create snapshots and export your alt text data"
    >
      <Layout>
        {actionData?.success && (
          <Layout.Section>
            <Banner title="Success" tone="success">
              <Text as="p">{actionData.message}</Text>
            </Banner>
          </Layout.Section>
        )}

        {actionData?.csv && (
          <Layout.Section>
            <Banner title="CSV Export Ready" tone="success">
              <BlockStack gap="200">
                <Text as="p">Your CSV file has been generated.</Text>
                <Button onClick={handleDownloadCsv} variant="primary">
                  Download CSV
                </Button>
              </BlockStack>
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Create Backup
              </Text>
              <Text as="p" variant="bodyMd">
                Create a snapshot of all current alt text, tags, and structured data.
                You can restore from any previous backup at any time.
              </Text>
              <Button
                variant="primary"
                onClick={handleCreate}
                disabled={isProcessing}
              >
                {isProcessing ? "Creating..." : "Create Backup Now"}
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Export to CSV
              </Text>
              <Text as="p" variant="bodyMd">
                Export all alt text data to a CSV file for external use or backup.
                Includes product titles, image URLs, original and AI-generated alt text.
              </Text>
              <Button
                onClick={handleExport}
                disabled={isProcessing}
              >
                {isProcessing ? "Exporting..." : "Export CSV"}
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Backup History
              </Text>
              {backups.length === 0 ? (
                <EmptyState heading="No backups yet">
                  <Text as="p">
                    Create your first backup to start tracking changes.
                  </Text>
                </EmptyState>
              ) : (
                <DataTable
                  columnContentTypes={["text", "numeric", "text"]}
                  headings={["Created At", "Records", "Actions"]}
                  rows={rows}
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
