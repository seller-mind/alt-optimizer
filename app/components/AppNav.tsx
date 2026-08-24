import { useLocation, Link } from "@remix-run/react";
import {
  Box,
  InlineStack,
  Text,
  BlockStack,
} from "@shopify/polaris";
import { useState } from "react";

interface NavItem {
  label: string;
  url: string;
  matchPrefix: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", url: "/app", matchPrefix: "/app" },
  { label: "Products", url: "/app/products", matchPrefix: "/app/products" },
  { label: "Generate", url: "/app/generate", matchPrefix: "/app/generate" },
  { label: "Review", url: "/app/review", matchPrefix: "/app/review" },
  { label: "Backup", url: "/app/backup", matchPrefix: "/app/backup" },
  { label: "Settings", url: "/app/settings", matchPrefix: "/app/settings" },
];

export function AppNav() {
  const location = useLocation();

  return (
    <Box
      padding="300"
      borderColor="border"
      borderWidth="0 0 1 0"
      background="bg-surface"
    >
      <InlineStack gap="400" align="start" blockAlign="center">
        <Text as="h1" variant="headingMd" fontWeight="bold">
          AltOptimizer
        </Text>
        <InlineStack gap="100">
          {navItems.map((item) => {
            const isActive =
              item.matchPrefix === "/app"
                ? location.pathname === "/app"
                : location.pathname.startsWith(item.matchPrefix);

            return (
              <Link
                key={item.url}
                to={item.url}
                style={{
                  textDecoration: "none",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  backgroundColor: isActive ? "var(--p-color-bg-fill-brand)" : "transparent",
                  color: isActive ? "var(--p-color-text-inverse)" : "var(--p-color-text)",
                  fontSize: "14px",
                  fontWeight: isActive ? 600 : 400,
                  transition: "all 0.15s ease",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </InlineStack>
      </InlineStack>
    </Box>
  );
}
