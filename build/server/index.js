import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "stream";
import { createReadableStreamFromReadable } from "@remix-run/node";
import { RemixServer, Meta, Links, Outlet, ScrollRestoration, Scripts, useLoaderData, useActionData, useSubmit, useNavigation, json, useRouteError, isRouteErrorResponse, useLocation, Link } from "@remix-run/react";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { useIndexResourceState, Page, Layout, Banner, Text, Card, BlockStack, FormLayout, Select, ChoiceList, InlineStack, Button, IndexTable, Thumbnail, Badge, EmptyState, DataTable, ProgressBar, Grid, Box, Modal, TextField } from "@shopify/polaris";
import { useState, useCallback } from "react";
import "@shopify/shopify-app-remix/adapters/node";
import { shopifyApp, AppDistribution, ApiVersion } from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
const streamTimeout = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, remixContext, _loadContext) {
  return isbot(request.headers.get("user-agent") || "") ? handleBotRequest(request, responseStatusCode, responseHeaders, remixContext) : handleBrowserRequest(request, responseStatusCode, responseHeaders, remixContext);
}
function handleBotRequest(_request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(RemixServer, { context: remixContext, url: _request.url }),
      {
        onAllReady() {
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          console.error(error);
        }
      }
    );
    setTimeout(abort, streamTimeout);
  });
}
function handleBrowserRequest(_request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(RemixServer, { context: remixContext, url: _request.url }),
      {
        onShellReady() {
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          console.error(error);
        }
      }
    );
    setTimeout(abort, streamTimeout);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest,
  streamTimeout
}, Symbol.toStringTag, { value: "Module" }));
const polarisStyles = "/assets/styles-BeiPL2RV.css";
const Polaris = {
  ActionMenu: {
    Actions: {
      moreActions: "More actions"
    },
    RollupActions: {
      rollupButton: "View actions"
    }
  },
  ActionList: {
    SearchField: {
      clearButtonLabel: "Clear",
      search: "Search",
      placeholder: "Search actions"
    }
  },
  Avatar: {
    label: "Avatar",
    labelWithInitials: "Avatar with initials {initials}"
  },
  Autocomplete: {
    spinnerAccessibilityLabel: "Loading",
    ellipsis: "{content}…"
  },
  Badge: {
    PROGRESS_LABELS: {
      incomplete: "Incomplete",
      partiallyComplete: "Partially complete",
      complete: "Complete"
    },
    TONE_LABELS: {
      info: "Info",
      success: "Success",
      warning: "Warning",
      critical: "Critical",
      attention: "Attention",
      "new": "New",
      readOnly: "Read-only",
      enabled: "Enabled"
    },
    progressAndTone: "{toneLabel} {progressLabel}"
  },
  Banner: {
    dismissButton: "Dismiss notification"
  },
  Button: {
    spinnerAccessibilityLabel: "Loading"
  },
  Common: {
    checkbox: "checkbox",
    undo: "Undo",
    cancel: "Cancel",
    clear: "Clear",
    close: "Close",
    submit: "Submit",
    more: "More"
  },
  ContextualSaveBar: {
    save: "Save",
    discard: "Discard"
  },
  DataTable: {
    sortAccessibilityLabel: "sort {direction} by",
    navAccessibilityLabel: "Scroll table {direction} one column",
    totalsRowHeading: "Totals",
    totalRowHeading: "Total"
  },
  DatePicker: {
    previousMonth: "Show previous month, {previousMonthName} {showPreviousYear}",
    nextMonth: "Show next month, {nextMonth} {nextYear}",
    today: "Today ",
    start: "Start of range",
    end: "End of range",
    months: {
      january: "January",
      february: "February",
      march: "March",
      april: "April",
      may: "May",
      june: "June",
      july: "July",
      august: "August",
      september: "September",
      october: "October",
      november: "November",
      december: "December"
    },
    days: {
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday"
    },
    daysAbbreviated: {
      monday: "Mo",
      tuesday: "Tu",
      wednesday: "We",
      thursday: "Th",
      friday: "Fr",
      saturday: "Sa",
      sunday: "Su"
    }
  },
  DiscardConfirmationModal: {
    title: "Discard all unsaved changes",
    message: "If you discard changes, you’ll delete any edits you made since you last saved.",
    primaryAction: "Discard changes",
    secondaryAction: "Continue editing"
  },
  DropZone: {
    single: {
      overlayTextFile: "Drop file to upload",
      overlayTextImage: "Drop image to upload",
      overlayTextVideo: "Drop video to upload",
      actionTitleFile: "Add file",
      actionTitleImage: "Add image",
      actionTitleVideo: "Add video",
      actionHintFile: "or drop file to upload",
      actionHintImage: "or drop image to upload",
      actionHintVideo: "or drop video to upload",
      labelFile: "Upload file",
      labelImage: "Upload image",
      labelVideo: "Upload video"
    },
    allowMultiple: {
      overlayTextFile: "Drop files to upload",
      overlayTextImage: "Drop images to upload",
      overlayTextVideo: "Drop videos to upload",
      actionTitleFile: "Add files",
      actionTitleImage: "Add images",
      actionTitleVideo: "Add videos",
      actionHintFile: "or drop files to upload",
      actionHintImage: "or drop images to upload",
      actionHintVideo: "or drop videos to upload",
      labelFile: "Upload files",
      labelImage: "Upload images",
      labelVideo: "Upload videos"
    },
    errorOverlayTextFile: "File type is not valid",
    errorOverlayTextImage: "Image type is not valid",
    errorOverlayTextVideo: "Video type is not valid"
  },
  EmptySearchResult: {
    altText: "Empty search results"
  },
  Frame: {
    skipToContent: "Skip to content",
    navigationLabel: "Navigation",
    Navigation: {
      closeMobileNavigationLabel: "Close navigation"
    }
  },
  FullscreenBar: {
    back: "Back",
    accessibilityLabel: "Exit fullscreen mode"
  },
  Filters: {
    moreFilters: "More filters",
    moreFiltersWithCount: "More filters ({count})",
    filter: "Filter {resourceName}",
    noFiltersApplied: "No filters applied",
    cancel: "Cancel",
    done: "Done",
    clearAllFilters: "Clear all filters",
    clear: "Clear",
    clearLabel: "Clear {filterName}",
    addFilter: "Add filter",
    clearFilters: "Clear all",
    searchInView: "in:{viewName}"
  },
  FilterPill: {
    clear: "Clear",
    unsavedChanges: "Unsaved changes - {label}"
  },
  IndexFilters: {
    searchFilterTooltip: "Search and filter",
    searchFilterTooltipWithShortcut: "Search and filter (F)",
    searchFilterAccessibilityLabel: "Search and filter results",
    sort: "Sort your results",
    addView: "Add a new view",
    newView: "Custom search",
    SortButton: {
      ariaLabel: "Sort the results",
      tooltip: "Sort",
      title: "Sort by",
      sorting: {
        asc: "Ascending",
        desc: "Descending",
        az: "A-Z",
        za: "Z-A"
      }
    },
    EditColumnsButton: {
      tooltip: "Edit columns",
      accessibilityLabel: "Customize table column order and visibility"
    },
    UpdateButtons: {
      cancel: "Cancel",
      update: "Update",
      save: "Save",
      saveAs: "Save as",
      modal: {
        title: "Save view as",
        label: "Name",
        sameName: "A view with this name already exists. Please choose a different name.",
        save: "Save",
        cancel: "Cancel"
      }
    }
  },
  IndexProvider: {
    defaultItemSingular: "Item",
    defaultItemPlural: "Items",
    allItemsSelected: "All {itemsLength}+ {resourceNamePlural} are selected",
    selected: "{selectedItemsCount} selected",
    a11yCheckboxDeselectAllSingle: "Deselect {resourceNameSingular}",
    a11yCheckboxSelectAllSingle: "Select {resourceNameSingular}",
    a11yCheckboxDeselectAllMultiple: "Deselect all {itemsLength} {resourceNamePlural}",
    a11yCheckboxSelectAllMultiple: "Select all {itemsLength} {resourceNamePlural}"
  },
  IndexTable: {
    emptySearchTitle: "No {resourceNamePlural} found",
    emptySearchDescription: "Try changing the filters or search term",
    onboardingBadgeText: "New",
    resourceLoadingAccessibilityLabel: "Loading {resourceNamePlural}…",
    selectAllLabel: "Select all {resourceNamePlural}",
    selected: "{selectedItemsCount} selected",
    undo: "Undo",
    selectAllItems: "Select all {itemsLength}+ {resourceNamePlural}",
    selectItem: "Select {resourceName}",
    selectButtonText: "Select",
    sortAccessibilityLabel: "sort {direction} by"
  },
  Loading: {
    label: "Page loading bar"
  },
  Modal: {
    iFrameTitle: "body markup",
    modalWarning: "These required properties are missing from Modal: {missingProps}"
  },
  Page: {
    Header: {
      rollupActionsLabel: "View actions for {title}",
      pageReadyAccessibilityLabel: "{title}. This page is ready"
    }
  },
  Pagination: {
    previous: "Previous",
    next: "Next",
    pagination: "Pagination"
  },
  ProgressBar: {
    negativeWarningMessage: "Values passed to the progress prop shouldn’t be negative. Resetting {progress} to 0.",
    exceedWarningMessage: "Values passed to the progress prop shouldn’t exceed 100. Setting {progress} to 100."
  },
  ResourceList: {
    sortingLabel: "Sort by",
    defaultItemSingular: "item",
    defaultItemPlural: "items",
    showing: "Showing {itemsCount} {resource}",
    showingTotalCount: "Showing {itemsCount} of {totalItemsCount} {resource}",
    loading: "Loading {resource}",
    selected: "{selectedItemsCount} selected",
    allItemsSelected: "All {itemsLength}+ {resourceNamePlural} in your store are selected",
    allFilteredItemsSelected: "All {itemsLength}+ {resourceNamePlural} in this filter are selected",
    selectAllItems: "Select all {itemsLength}+ {resourceNamePlural} in your store",
    selectAllFilteredItems: "Select all {itemsLength}+ {resourceNamePlural} in this filter",
    emptySearchResultTitle: "No {resourceNamePlural} found",
    emptySearchResultDescription: "Try changing the filters or search term",
    selectButtonText: "Select",
    a11yCheckboxDeselectAllSingle: "Deselect {resourceNameSingular}",
    a11yCheckboxSelectAllSingle: "Select {resourceNameSingular}",
    a11yCheckboxDeselectAllMultiple: "Deselect all {itemsLength} {resourceNamePlural}",
    a11yCheckboxSelectAllMultiple: "Select all {itemsLength} {resourceNamePlural}",
    Item: {
      actionsDropdownLabel: "Actions for {accessibilityLabel}",
      actionsDropdown: "Actions dropdown",
      viewItem: "View details for {itemName}"
    },
    BulkActions: {
      actionsActivatorLabel: "Actions",
      moreActionsActivatorLabel: "More actions"
    }
  },
  SkeletonPage: {
    loadingLabel: "Page loading"
  },
  Tabs: {
    newViewAccessibilityLabel: "Create new view",
    newViewTooltip: "Create view",
    toggleTabsLabel: "More views",
    Tab: {
      rename: "Rename view",
      duplicate: "Duplicate view",
      edit: "Edit view",
      editColumns: "Edit columns",
      "delete": "Delete view",
      copy: "Copy of {name}",
      deleteModal: {
        title: "Delete view?",
        description: "This can’t be undone. {viewName} view will no longer be available in your admin.",
        cancel: "Cancel",
        "delete": "Delete view"
      }
    },
    RenameModal: {
      title: "Rename view",
      label: "Name",
      cancel: "Cancel",
      create: "Save",
      errors: {
        sameName: "A view with this name already exists. Please choose a different name."
      }
    },
    DuplicateModal: {
      title: "Duplicate view",
      label: "Name",
      cancel: "Cancel",
      create: "Create view",
      errors: {
        sameName: "A view with this name already exists. Please choose a different name."
      }
    },
    CreateViewModal: {
      title: "Create new view",
      label: "Name",
      cancel: "Cancel",
      create: "Create view",
      errors: {
        sameName: "A view with this name already exists. Please choose a different name."
      }
    }
  },
  Tag: {
    ariaLabel: "Remove {children}"
  },
  TextField: {
    characterCount: "{count} characters",
    characterCountWithMaxLength: "{count} of {limit} characters used"
  },
  TooltipOverlay: {
    accessibilityLabel: "Tooltip: {label}"
  },
  TopBar: {
    toggleMenuLabel: "Toggle menu",
    SearchField: {
      clearButtonLabel: "Clear",
      search: "Search"
    }
  },
  MediaCard: {
    dismissButton: "Dismiss",
    popoverButton: "Actions"
  },
  VideoThumbnail: {
    playButtonA11yLabel: {
      "default": "Play video",
      defaultWithDuration: "Play video of length {duration}",
      duration: {
        hours: {
          other: {
            only: "{hourCount} hours",
            andMinutes: "{hourCount} hours and {minuteCount} minutes",
            andMinute: "{hourCount} hours and {minuteCount} minute",
            minutesAndSeconds: "{hourCount} hours, {minuteCount} minutes, and {secondCount} seconds",
            minutesAndSecond: "{hourCount} hours, {minuteCount} minutes, and {secondCount} second",
            minuteAndSeconds: "{hourCount} hours, {minuteCount} minute, and {secondCount} seconds",
            minuteAndSecond: "{hourCount} hours, {minuteCount} minute, and {secondCount} second",
            andSeconds: "{hourCount} hours and {secondCount} seconds",
            andSecond: "{hourCount} hours and {secondCount} second"
          },
          one: {
            only: "{hourCount} hour",
            andMinutes: "{hourCount} hour and {minuteCount} minutes",
            andMinute: "{hourCount} hour and {minuteCount} minute",
            minutesAndSeconds: "{hourCount} hour, {minuteCount} minutes, and {secondCount} seconds",
            minutesAndSecond: "{hourCount} hour, {minuteCount} minutes, and {secondCount} second",
            minuteAndSeconds: "{hourCount} hour, {minuteCount} minute, and {secondCount} seconds",
            minuteAndSecond: "{hourCount} hour, {minuteCount} minute, and {secondCount} second",
            andSeconds: "{hourCount} hour and {secondCount} seconds",
            andSecond: "{hourCount} hour and {secondCount} second"
          }
        },
        minutes: {
          other: {
            only: "{minuteCount} minutes",
            andSeconds: "{minuteCount} minutes and {secondCount} seconds",
            andSecond: "{minuteCount} minutes and {secondCount} second"
          },
          one: {
            only: "{minuteCount} minute",
            andSeconds: "{minuteCount} minute and {secondCount} seconds",
            andSecond: "{minuteCount} minute and {secondCount} second"
          }
        },
        seconds: {
          other: "{secondCount} seconds",
          one: "{secondCount} second"
        }
      }
    }
  }
};
const en = {
  Polaris
};
const links = () => [{ rel: "stylesheet", href: polarisStyles }];
function App() {
  return /* @__PURE__ */ jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsxs("head", { children: [
      /* @__PURE__ */ jsx("meta", { charSet: "utf-8" }),
      /* @__PURE__ */ jsx("meta", { name: "viewport", content: "width=device-width, initial-scale=1" }),
      /* @__PURE__ */ jsx("title", { children: "AltOptimizer - AI Product Optimizer" }),
      /* @__PURE__ */ jsx(Meta, {}),
      /* @__PURE__ */ jsx(Links, {})
    ] }),
    /* @__PURE__ */ jsxs("body", { children: [
      /* @__PURE__ */ jsx(AppProvider, { i18n: en, isEmbeddedApp: true, children: /* @__PURE__ */ jsx(Outlet, {}) }),
      /* @__PURE__ */ jsx(ScrollRestoration, {}),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: App,
  links
}, Symbol.toStringTag, { value: "Module" }));
const prisma = globalThis.__prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY || "",
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  scopes: [
    "read_products",
    "write_products",
    "read_themes",
    "write_themes",
    "read_content",
    "write_content"
  ],
  apiVersion: ApiVersion.October24,
  isEmbeddedApp: true,
  appDistribution: AppDistribution.AppStore,
  appUrl: process.env.HOST || "https://localhost:5000",
  sessionStorage: new PrismaSessionStorage(prisma),
  billing: {
    Free: {
      amount: 0,
      currencyCode: "USD",
      interval: "EVER_30_DAYS",
      usageTerms: "50 image generations per month"
    },
    Starter: {
      amount: 9,
      currencyCode: "USD",
      interval: "EVER_30_DAYS",
      usageTerms: "300 image generations per month"
    },
    Professional: {
      amount: 19,
      currencyCode: "USD",
      interval: "EVER_30_DAYS",
      usageTerms: "1000 image generations per month"
    },
    Business: {
      amount: 49,
      currencyCode: "USD",
      interval: "EVER_30_DAYS",
      usageTerms: "5000 image generations per month"
    }
  },
  hooks: {
    afterAuth: async ({ session }) => {
      const shop = session.shop;
      console.log(`[AltOptimizer] App installed for shop: ${shop}`);
    }
  },
  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: "http",
      callbackUrl: "/webhooks/app/uninstalled"
    },
    SHOP_REDACT: {
      deliveryMethod: "http",
      callbackUrl: "/webhooks/shop/redact"
    },
    CUSTOMERS_DATA_REQUEST: {
      deliveryMethod: "http",
      callbackUrl: "/webhooks/customers/data_request"
    }
  }
});
const { authenticate, registerWebhooks, sessionStorage, addDocumentResponseHeaders } = shopify;
ApiVersion.October24;
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ""
});
const ALT_TEXT_SYSTEM_PROMPT = `You are an SEO expert specializing in e-commerce product image optimization.
Analyze the product image and generate SEO-optimized alt text.

Requirements:
- Alt text must be under 125 characters
- Describe the main product/object clearly
- Include relevant visual details (color, material, style)
- Be specific and descriptive for accessibility
- Include key product attributes that help with SEO

Respond in JSON format with:
{
  "altText": "the generated alt text (under 125 chars)",
  "analysis": {
    "objects": ["list of detected objects"],
    "colors": ["detected colors"],
    "context": "brief scene/context description",
    "category": "product category"
  }
}`;
const TAGS_SYSTEM_PROMPT = `You are an e-commerce SEO expert. Generate relevant product tags based on the image, title, and description.

Requirements:
- Generate 5-10 relevant tags
- Include product type, style, color, material, occasion
- Tags should be lowercase, hyphenated phrases
- Focus on discoverability and SEO value

Respond in JSON format with:
{
  "tags": ["tag1", "tag2", "tag3"]
}`;
async function analyzeImage(imageBase64, mimeType, productTitle, locale = "en") {
  var _a, _b, _c;
  const localeInstruction = getLocaleInstruction(locale);
  const dataUrl = `data:${mimeType};base64,${imageBase64}`;
  const userMessage = productTitle ? `Product title: "${productTitle}"

${localeInstruction}` : localeInstruction;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: ALT_TEXT_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: userMessage },
            { type: "image_url", image_url: { url: dataUrl, detail: "high" } }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500
    });
    const text = ((_b = (_a = response.choices[0]) == null ? void 0 : _a.message) == null ? void 0 : _b.content) || "{}";
    const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleanedText);
    return {
      altText: ((_c = parsed.altText) == null ? void 0 : _c.substring(0, 125)) || "",
      analysis: parsed.analysis || { objects: [], colors: [], context: "", category: "" }
    };
  } catch (error) {
    console.error("[OpenAI] analyzeImage error:", error);
    return {
      altText: "",
      analysis: { objects: [], colors: [], context: "", category: "" }
    };
  }
}
async function generateTags(imageBase64, mimeType, productTitle, productDescription, locale = "en") {
  var _a, _b;
  const localeInstruction = getLocaleInstruction(locale);
  const dataUrl = `data:${mimeType};base64,${imageBase64}`;
  const userMessage = `Product Title: "${productTitle}"
Product Description: "${productDescription || "No description available"}"

${localeInstruction}`;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: TAGS_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: userMessage },
            { type: "image_url", image_url: { url: dataUrl, detail: "high" } }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500
    });
    const text = ((_b = (_a = response.choices[0]) == null ? void 0 : _a.message) == null ? void 0 : _b.content) || "{}";
    const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleanedText);
    return { tags: parsed.tags || [] };
  } catch (error) {
    console.error("[OpenAI] generateTags error:", error);
    return { tags: [] };
  }
}
async function generateJsonLd(product, shopDomain) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description || product.title,
    image: product.images.map((img) => img.src),
    brand: {
      "@type": "Brand",
      name: product.vendor || shopDomain
    },
    sku: product.sku || product.handle,
    offers: {
      "@type": "Offer",
      price: product.price || "0",
      priceCurrency: product.currency || "USD",
      availability: "https://schema.org/InStock",
      url: `https://${shopDomain}/products/${product.handle}`
    }
  };
  return JSON.stringify(jsonLd, null, 2);
}
function getLocaleInstruction(locale) {
  const localeMap = {
    en: "Write in English",
    es: "Write in Spanish",
    fr: "Write in French",
    de: "Write in German",
    pt: "Write in Portuguese",
    ja: "Write in Japanese",
    zh: "Write in Chinese",
    ko: "Write in Korean",
    it: "Write in Italian",
    nl: "Write in Dutch"
  };
  return localeMap[locale] || "Write in English";
}
async function fetchProducts(admin, cursor = null) {
  const afterClause = cursor ? `, after: "${cursor}"` : "";
  const response = await admin.graphql(`
    {
      products(first: 50${afterClause}) {
        edges {
          cursor
          node {
            id
            title
            handle
            description
            vendor
            productType
            tags
            status
            images(first: 10) {
              edges {
                node {
                  id
                  url
                  altText
                  width
                  height
                }
              }
            }
            variants(first: 5) {
              edges {
                node {
                  id
                  title
                  price
                  sku
                  compareAtPrice
                }
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `);
  const data = await response.json();
  const products = data.data.products.edges.map((edge) => ({
    id: edge.node.id,
    title: edge.node.title,
    handle: edge.node.handle,
    description: edge.node.description || "",
    vendor: edge.node.vendor || "",
    productType: edge.node.productType || "",
    tags: edge.node.tags || [],
    status: edge.node.status,
    images: edge.node.images.edges.map((img) => ({
      id: img.node.id,
      src: img.node.url,
      altText: img.node.altText,
      width: img.node.width,
      height: img.node.height
    })),
    variants: edge.node.variants.edges.map((v) => ({
      id: v.node.id,
      title: v.node.title,
      price: v.node.price,
      sku: v.node.sku,
      compareAtPrice: v.node.compareAtPrice
    }))
  }));
  return {
    products,
    cursor: data.data.products.pageInfo.hasNextPage ? data.data.products.pageInfo.endCursor : null
  };
}
async function updateImageAltText(admin, imageId, altText) {
  var _a, _b;
  const response = await admin.graphql(`
    mutation {
      productUpdateMedia(media: [{
        id: "${imageId}",
        alt: "${altText.replace(/"/g, '\\"')}"
      }]) {
        media {
          id
          alt
        }
        mediaUserErrors {
          field
          message
        }
      }
    }
  `);
  const data = await response.json();
  const errors = (_b = (_a = data.data) == null ? void 0 : _a.productUpdateMedia) == null ? void 0 : _b.mediaUserErrors;
  return !errors || errors.length === 0;
}
async function fetchImageAsBase64(imageUrl) {
  const response = await fetch(imageUrl);
  const contentType = response.headers.get("content-type") || "image/jpeg";
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return { base64, mimeType: contentType };
}
const PLANS = {
  free: {
    name: "Free",
    price: 0,
    monthlyQuota: 50,
    description: "Perfect for trying out AltOptimizer"
  },
  starter: {
    name: "Starter",
    price: 9,
    monthlyQuota: 300,
    description: "For small stores getting started"
  },
  professional: {
    name: "Professional",
    price: 19,
    monthlyQuota: 1e3,
    description: "For growing businesses"
  },
  business: {
    name: "Business",
    price: 49,
    monthlyQuota: 5e3,
    description: "For high-volume stores"
  }
};
async function getCurrentUsage(shopId) {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) throw new Error("Shop not found");
  const plan = PLANS[shop.planType] || PLANS.free;
  const now = /* @__PURE__ */ new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const dateStr = monthStart.toISOString().split("T")[0];
  const metric = await prisma.usageMetric.findUnique({
    where: { shopId_date: { shopId, date: dateStr } }
  });
  const imagesGenerated = (metric == null ? void 0 : metric.imagesGenerated) || 0;
  const apiCalls = (metric == null ? void 0 : metric.apiCalls) || 0;
  return {
    imagesGenerated,
    apiCalls,
    quota: plan.monthlyQuota,
    percentage: Math.round(imagesGenerated / plan.monthlyQuota * 100),
    planName: plan.name
  };
}
async function incrementUsage(shopId, imagesCount = 1) {
  const now = /* @__PURE__ */ new Date();
  const dateStr = now.toISOString().split("T")[0];
  await prisma.usageMetric.upsert({
    where: { shopId_date: { shopId, date: dateStr } },
    update: {
      imagesGenerated: { increment: imagesCount },
      apiCalls: { increment: 1 }
    },
    create: {
      shopId,
      date: dateStr,
      imagesGenerated: imagesCount,
      apiCalls: 1
    }
  });
}
async function checkQuota(shopId) {
  const usage = await getCurrentUsage(shopId);
  const remaining = usage.quota - usage.imagesGenerated;
  return {
    canGenerate: remaining > 0,
    remaining,
    warning: usage.percentage >= 80
  };
}
async function getUsageHistory(shopId, days = 30) {
  const metrics = await prisma.usageMetric.findMany({
    where: { shopId },
    orderBy: { date: "desc" },
    take: days
  });
  return metrics.map((m) => ({
    date: m.date,
    imagesGenerated: m.imagesGenerated,
    apiCalls: m.apiCalls
  }));
}
const loader$7 = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop }
  });
  if (!shop) {
    throw new Response("Shop not found", { status: 404 });
  }
  const quota = await checkQuota(shop.id);
  const products = await prisma.product.findMany({
    where: {
      shopId: shop.id,
      images: {
        some: {
          OR: [
            { altTextOriginal: null },
            { status: "pending" }
          ]
        }
      }
    },
    include: {
      images: {
        where: {
          OR: [
            { altTextOriginal: null },
            { status: "pending" }
          ]
        }
      }
    },
    orderBy: { title: "asc" },
    take: 50
  });
  return {
    products: products.map((p) => ({
      id: p.id,
      title: p.title,
      handle: p.handle,
      images: p.images.map((img) => ({
        id: img.id,
        src: img.src,
        altTextOriginal: img.altTextOriginal,
        shopifyImageId: img.shopifyImageId
      }))
    })),
    quota,
    shopLocale: shop.locale
  };
};
const action$5 = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop }
  });
  if (!shop) {
    throw new Response("Shop not found", { status: 404 });
  }
  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent === "generate_alt") {
    const imageIds = formData.getAll("imageIds");
    const autoApply = formData.get("autoApply") === "true";
    const quota = await checkQuota(shop.id);
    if (!quota.canGenerate) {
      return json({
        success: false,
        error: "Monthly quota exceeded. Please upgrade your plan."
      });
    }
    const results = [];
    for (const imageIdStr of imageIds) {
      const imageId = parseInt(imageIdStr, 10);
      const image = await prisma.productImage.findUnique({
        where: { id: imageId },
        include: { product: true }
      });
      if (!image) continue;
      try {
        const { base64, mimeType } = await fetchImageAsBase64(image.src);
        const analysis = await analyzeImage(
          base64,
          mimeType,
          image.product.title,
          shop.locale
        );
        await prisma.productImage.update({
          where: { id: imageId },
          data: {
            altTextAi: analysis.altText,
            status: autoApply ? "applied" : "pending"
          }
        });
        if (autoApply) {
          await updateImageAltText(admin, image.shopifyImageId, analysis.altText);
        }
        await prisma.altTextHistory.create({
          data: {
            imageId,
            altText: analysis.altText,
            source: "ai"
          }
        });
        results.push({
          imageId,
          altText: analysis.altText,
          success: true
        });
      } catch (err) {
        results.push({
          imageId,
          altText: "",
          success: false,
          error: err instanceof Error ? err.message : "Unknown error"
        });
      }
    }
    await incrementUsage(shop.id, imageIds.length);
    const successCount = results.filter((r) => r.success).length;
    return json({
      success: true,
      generated: successCount,
      total: imageIds.length,
      results
    });
  }
  if (intent === "generate_tags") {
    const productIds = formData.getAll("productIds");
    const results = [];
    for (const productIdStr of productIds) {
      const productId = parseInt(productIdStr, 10);
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { images: true }
      });
      if (!product || product.images.length === 0) continue;
      try {
        const firstImage = product.images[0];
        const { base64, mimeType } = await fetchImageAsBase64(firstImage.src);
        const tagResult = await generateTags(
          base64,
          mimeType,
          product.title,
          product.description,
          shop.locale
        );
        await prisma.productImage.updateMany({
          where: { productId },
          data: { tagsAi: tagResult.tags.join(", ") }
        });
        results.push({
          productId,
          tags: tagResult.tags,
          success: true
        });
      } catch {
        results.push({ productId, tags: [], success: false });
      }
    }
    return json({
      success: true,
      results
    });
  }
  if (intent === "generate_jsonld") {
    const productIds = formData.getAll("productIds");
    for (const productIdStr of productIds) {
      const productId = parseInt(productIdStr, 10);
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { images: true }
      });
      if (!product) continue;
      try {
        const jsonLd = await generateJsonLd(
          {
            title: product.title,
            description: product.description,
            handle: product.handle,
            images: product.images.map((img) => ({
              src: img.src,
              altText: img.altTextOriginal || void 0
            }))
          },
          shop.shopDomain
        );
        await prisma.product.update({
          where: { id: productId },
          data: {
            jsonLdData: jsonLd,
            hasJsonLd: true
          }
        });
      } catch {
      }
    }
    return json({ success: true });
  }
  return json({ success: false, error: "Unknown action" });
};
function GeneratePage() {
  const { products, quota, shopLocale } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isGenerating = navigation.state !== "idle";
  const [generationType, setGenerationType] = useState("alt_text");
  const [autoApply, setAutoApply] = useState("false");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const allImageIds = products.flatMap((p) => p.images.map((img) => String(img.id)));
  const selectedResources = useIndexResourceState(products);
  const handleGenerate = useCallback(() => {
    const formData = new FormData();
    formData.set("intent", generationType === "alt_text" ? "generate_alt" : generationType === "tags" ? "generate_tags" : "generate_jsonld");
    formData.set("autoApply", autoApply);
    if (generationType === "alt_text") {
      const selectedImageIds = selectedResources.selectedResources.length > 0 ? products.filter((p) => selectedResources.selectedResources.includes(String(p.id))).flatMap((p) => p.images.map((img) => String(img.id))) : allImageIds;
      selectedImageIds.forEach((id) => formData.append("imageIds", id));
    } else {
      const selectedProductIds = selectedResources.selectedResources.length > 0 ? selectedResources.selectedResources : products.map((p) => String(p.id));
      selectedProductIds.forEach((id) => formData.append("productIds", id));
    }
    submit(formData, { method: "post" });
  }, [generationType, autoApply, selectedResources.selectedResources, products, allImageIds, submit]);
  return /* @__PURE__ */ jsx(Page, { title: "AI Generation", subtitle: "Generate alt text, tags, and structured data", children: /* @__PURE__ */ jsxs(Layout, { children: [
    quota.warning && /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(
      Banner,
      {
        title: "Quota warning",
        tone: quota.percentage >= 95 ? "critical" : "warning",
        children: /* @__PURE__ */ jsxs(Text, { as: "p", children: [
          "You have used ",
          quota.percentage,
          "% of your monthly quota.",
          quota.remaining,
          " generations remaining."
        ] })
      }
    ) }),
    actionData && actionData.success && /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Banner, { title: "Generation complete", tone: "success", children: /* @__PURE__ */ jsx(Text, { as: "p", children: "generated" in actionData ? `Successfully generated ${actionData.generated} of ${actionData.total} alt texts.` : "Operation completed successfully." }) }) }),
    actionData && !actionData.success && /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Banner, { title: "Error", tone: "critical", children: /* @__PURE__ */ jsx(Text, { as: "p", children: "error" in actionData ? actionData.error : "An error occurred." }) }) }),
    /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
      /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Generation Settings" }),
      /* @__PURE__ */ jsxs(FormLayout, { children: [
        /* @__PURE__ */ jsx(
          Select,
          {
            label: "Generation Type",
            options: [
              { label: "Alt Text (Image descriptions)", value: "alt_text" },
              { label: "Product Tags", value: "tags" },
              { label: "JSON-LD Structured Data", value: "jsonld" }
            ],
            value: generationType,
            onChange: setGenerationType
          }
        ),
        generationType === "alt_text" && /* @__PURE__ */ jsx(
          ChoiceList,
          {
            title: "Auto-apply to Shopify",
            choices: [
              { label: "Yes, apply immediately to store", value: "true" },
              { label: "No, save for review first", value: "false" }
            ],
            selected: [autoApply],
            onChange: ([value]) => setAutoApply(value)
          }
        ),
        /* @__PURE__ */ jsxs(InlineStack, { gap: "200", align: "space-between", children: [
          /* @__PURE__ */ jsxs(Text, { as: "p", variant: "bodySm", tone: "subdued", children: [
            products.length,
            " products eligible for generation"
          ] }),
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "primary",
              onClick: handleGenerate,
              disabled: isGenerating || products.length === 0,
              children: isGenerating ? "Generating..." : `Generate ${generationType === "alt_text" ? "Alt Text" : generationType === "tags" ? "Tags" : "JSON-LD"}`
            }
          )
        ] })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
      /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Eligible Products" }),
      /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodySm", tone: "subdued", children: "Select specific products or leave all selected to generate for all eligible items." }),
      products.length === 0 ? /* @__PURE__ */ jsx(Text, { as: "p", alignment: "center", children: "All products have alt text. No generation needed." }) : /* @__PURE__ */ jsx(
        IndexTable,
        {
          resourceName: { singular: "product", plural: "products" },
          itemCount: products.length,
          selectedItemsCount: selectedResources.selectedItemsCount,
          headings: [
            { title: "Image" },
            { title: "Product" },
            { title: "Images Needing Alt" }
          ],
          ...selectedResources,
          children: products.map((product, index) => {
            var _a;
            return /* @__PURE__ */ jsxs(
              IndexTable.Row,
              {
                id: String(product.id),
                selected: selectedResources.selectedResources.includes(String(product.id)),
                position: index,
                children: [
                  /* @__PURE__ */ jsx(IndexTable.Cell, { children: /* @__PURE__ */ jsx(
                    Thumbnail,
                    {
                      source: ((_a = product.images[0]) == null ? void 0 : _a.src) || "",
                      alt: product.title,
                      size: "small"
                    }
                  ) }),
                  /* @__PURE__ */ jsxs(IndexTable.Cell, { children: [
                    /* @__PURE__ */ jsx(Text, { as: "p", fontWeight: "semibold", children: product.title }),
                    /* @__PURE__ */ jsxs(Text, { as: "p", variant: "bodySm", tone: "subdued", children: [
                      "/",
                      product.handle
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx(IndexTable.Cell, { children: /* @__PURE__ */ jsxs(Badge, { children: [
                    product.images.length,
                    " images"
                  ] }) })
                ]
              },
              product.id
            );
          })
        }
      )
    ] }) }) })
  ] }) });
}
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$5,
  default: GeneratePage,
  loader: loader$7
}, Symbol.toStringTag, { value: "Module" }));
async function syncProductsFromShopify(shopId, admin) {
  let cursor = null;
  let totalSynced = 0;
  let hasMore = true;
  while (hasMore) {
    const result = await fetchProducts(admin, cursor);
    for (const product of result.products) {
      await upsertProduct(shopId, product);
      totalSynced++;
    }
    cursor = result.cursor;
    hasMore = cursor !== null;
  }
  return { synced: totalSynced, total: totalSynced };
}
async function upsertProduct(shopId, product) {
  const existingProduct = await prisma.product.findFirst({
    where: {
      shopId,
      shopifyProductId: product.id
    }
  });
  let productId;
  if (existingProduct) {
    const updated = await prisma.product.update({
      where: { id: existingProduct.id },
      data: {
        title: product.title,
        handle: product.handle,
        description: product.description,
        imageCount: product.images.length
      }
    });
    productId = updated.id;
  } else {
    const created = await prisma.product.create({
      data: {
        shopId,
        shopifyProductId: product.id,
        title: product.title,
        handle: product.handle,
        description: product.description,
        imageCount: product.images.length
      }
    });
    productId = created.id;
  }
  for (const image of product.images) {
    await upsertProductImage(productId, image, product.tags);
  }
}
async function upsertProductImage(productId, image, tags) {
  const existingImage = await prisma.productImage.findFirst({
    where: {
      productId,
      shopifyImageId: image.id
    }
  });
  if (existingImage) {
    await prisma.productImage.update({
      where: { id: existingImage.id },
      data: {
        src: image.src,
        altTextOriginal: image.altText,
        tagsOriginal: tags.join(", ")
      }
    });
  } else {
    await prisma.productImage.create({
      data: {
        productId,
        shopifyImageId: image.id,
        src: image.src,
        altTextOriginal: image.altText,
        tagsOriginal: tags.join(", "),
        status: image.altText ? "approved" : "pending"
      }
    });
  }
}
async function getDashboardStats(shopId) {
  const [
    totalProducts,
    totalImages,
    imagesWithAlt,
    imagesWithAi,
    imagesPending,
    usageMetrics
  ] = await Promise.all([
    prisma.product.count({ where: { shopId } }),
    prisma.productImage.count({ where: { product: { shopId } } }),
    prisma.productImage.count({
      where: { product: { shopId }, altTextOriginal: { not: null } }
    }),
    prisma.productImage.count({
      where: { product: { shopId }, altTextAi: { not: null } }
    }),
    prisma.productImage.count({
      where: { product: { shopId }, status: "pending" }
    }),
    prisma.usageMetric.aggregate({
      where: { shopId },
      _sum: { imagesGenerated: true, apiCalls: true }
    })
  ]);
  return {
    totalProducts,
    totalImages,
    imagesWithAlt,
    imagesWithAi,
    imagesPending,
    totalGenerated: usageMetrics._sum.imagesGenerated || 0,
    totalApiCalls: usageMetrics._sum.apiCalls || 0
  };
}
const loader$6 = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop }
  });
  if (!shop) {
    throw new Response("Shop not found", { status: 404 });
  }
  const url = new URL(request.url);
  const filter = url.searchParams.get("filter") || "all";
  const where = { shopId: shop.id };
  if (filter === "missing_alt") {
    where.images = { some: { altTextOriginal: null } };
  } else if (filter === "has_alt") {
    where.images = { some: { altTextOriginal: { not: null } } };
  } else if (filter === "has_tags") {
    where.images = { some: { tagsOriginal: { not: null } } };
  } else if (filter === "has_jsonld") {
    where.hasJsonLd = true;
  }
  const products = await prisma.product.findMany({
    where,
    include: {
      images: {
        take: 1
      },
      _count: {
        select: { images: true }
      }
    },
    orderBy: { title: "asc" },
    take: 100
  });
  return {
    products: products.map((p) => {
      var _a;
      return {
        id: p.id,
        shopifyProductId: p.shopifyProductId,
        title: p.title,
        handle: p.handle,
        imageCount: p._count.images,
        hasJsonLd: p.hasJsonLd,
        firstImage: ((_a = p.images[0]) == null ? void 0 : _a.src) || null,
        hasAltText: p.images.some((img) => img.altTextOriginal !== null),
        missingAltCount: p.images.filter((img) => img.altTextOriginal === null).length
      };
    }),
    filter,
    totalProducts: products.length
  };
};
const action$4 = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop }
  });
  if (!shop) {
    throw new Response("Shop not found", { status: 404 });
  }
  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent === "sync") {
    const result = await syncProductsFromShopify(shop.id, admin);
    return json({ success: true, synced: result.synced });
  }
  return json({ success: false });
};
function ProductsPage() {
  const { products, filter, totalProducts } = useLoaderData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSyncing = navigation.state !== "idle";
  const [selectedFilter, setSelectedFilter] = useState(filter);
  const handleFilterChange = useCallback(
    (value) => {
      setSelectedFilter(value);
      const params = new URLSearchParams();
      if (value !== "all") params.set("filter", value);
      submit(params, { method: "get" });
    },
    [submit]
  );
  const handleSync = useCallback(() => {
    const formData = new FormData();
    formData.set("intent", "sync");
    submit(formData, { method: "post" });
  }, [submit]);
  const selectedResources = useIndexResourceState(products);
  products.map((product, index) => {
    const altStatus = product.missingAltCount === 0 ? /* @__PURE__ */ jsx(Badge, { tone: "success", children: "Complete" }) : product.hasAltText ? /* @__PURE__ */ jsx(Badge, { tone: "warning", children: "Partial" }) : /* @__PURE__ */ jsx(Badge, { tone: "critical", children: "Missing" });
    return [
      /* @__PURE__ */ jsx(
        Thumbnail,
        {
          source: product.firstImage || "",
          alt: product.title,
          size: "small"
        }
      ),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", fontWeight: "semibold", children: product.title }),
        /* @__PURE__ */ jsxs(Text, { as: "p", variant: "bodySm", tone: "subdued", children: [
          "/",
          product.handle
        ] })
      ] }),
      product.imageCount,
      altStatus,
      product.hasJsonLd ? /* @__PURE__ */ jsx(Badge, { tone: "success", children: "Yes" }) : /* @__PURE__ */ jsx(Badge, { tone: "subdued", children: "No" })
    ];
  });
  return /* @__PURE__ */ jsx(
    Page,
    {
      title: "Products",
      subtitle: `${totalProducts} products found`,
      primaryAction: /* @__PURE__ */ jsx(Button, { variant: "primary", onClick: handleSync, disabled: isSyncing, children: isSyncing ? "Syncing..." : "Sync from Shopify" }),
      children: /* @__PURE__ */ jsx(Layout, { children: /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
        /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", blockAlign: "center", children: [
          /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Product Inventory" }),
          /* @__PURE__ */ jsx(InlineStack, { gap: "200", children: /* @__PURE__ */ jsx(
            Select,
            {
              label: "",
              labelInline: true,
              options: [
                { label: "All Products", value: "all" },
                { label: "Missing Alt Text", value: "missing_alt" },
                { label: "Has Alt Text", value: "has_alt" },
                { label: "Has Tags", value: "has_tags" },
                { label: "Has JSON-LD", value: "has_jsonld" }
              ],
              value: selectedFilter,
              onChange: handleFilterChange
            }
          ) })
        ] }),
        products.length === 0 ? /* @__PURE__ */ jsx(
          EmptyState,
          {
            heading: "No products found",
            action: {
              content: "Sync from Shopify",
              onAction: handleSync
            },
            children: /* @__PURE__ */ jsx(Text, { as: "p", children: "Sync your products from Shopify to start optimizing alt text." })
          }
        ) : /* @__PURE__ */ jsx(
          IndexTable,
          {
            resourceName: { singular: "product", plural: "products" },
            itemCount: products.length,
            selectedItemsCount: selectedResources.selectedItemsCount === "All" ? "All" : selectedResources.selectedResources.length,
            headings: [
              { title: "Image" },
              { title: "Product" },
              { title: "Images" },
              { title: "Alt Status" },
              { title: "JSON-LD" }
            ],
            ...selectedResources,
            children: products.map((product, index) => {
              const altStatus = product.missingAltCount === 0 ? /* @__PURE__ */ jsx(Badge, { tone: "success", children: "Complete" }) : product.hasAltText ? /* @__PURE__ */ jsx(Badge, { tone: "warning", children: "Partial" }) : /* @__PURE__ */ jsx(Badge, { tone: "critical", children: "Missing" });
              return /* @__PURE__ */ jsxs(
                IndexTable.Row,
                {
                  id: String(product.id),
                  selected: selectedResources.selectedResources.includes(String(product.id)),
                  position: index,
                  children: [
                    /* @__PURE__ */ jsx(IndexTable.Cell, { children: /* @__PURE__ */ jsx(
                      Thumbnail,
                      {
                        source: product.firstImage || "",
                        alt: product.title,
                        size: "small"
                      }
                    ) }),
                    /* @__PURE__ */ jsxs(IndexTable.Cell, { children: [
                      /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", fontWeight: "semibold", children: product.title }),
                      /* @__PURE__ */ jsxs(Text, { as: "p", variant: "bodySm", tone: "subdued", children: [
                        "/",
                        product.handle
                      ] })
                    ] }),
                    /* @__PURE__ */ jsx(IndexTable.Cell, { children: /* @__PURE__ */ jsx(Text, { as: "p", children: product.imageCount }) }),
                    /* @__PURE__ */ jsx(IndexTable.Cell, { children: altStatus }),
                    /* @__PURE__ */ jsx(IndexTable.Cell, { children: product.hasJsonLd ? /* @__PURE__ */ jsx(Badge, { tone: "success", children: "Yes" }) : /* @__PURE__ */ jsx(Badge, { tone: "subdued", children: "No" }) })
                  ]
                },
                product.id
              );
            })
          }
        )
      ] }) }) }) })
    }
  );
}
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$4,
  default: ProductsPage,
  loader: loader$6
}, Symbol.toStringTag, { value: "Module" }));
const loader$5 = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop }
  });
  if (!shop) {
    throw new Response("Shop not found", { status: 404 });
  }
  const [usage, history] = await Promise.all([
    getCurrentUsage(shop.id),
    getUsageHistory(shop.id, 30)
  ]);
  return {
    shopDomain: session.shop,
    planType: shop.planType,
    locale: shop.locale,
    usage,
    history,
    plans: Object.entries(PLANS).map(([key, plan]) => ({
      key,
      ...plan,
      isCurrent: key === shop.planType
    }))
  };
};
const action$3 = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop }
  });
  if (!shop) {
    throw new Response("Shop not found", { status: 404 });
  }
  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent === "update_plan") {
    const newPlan = formData.get("plan");
    if (PLANS[newPlan]) {
      await prisma.shop.update({
        where: { id: shop.id },
        data: { planType: newPlan }
      });
      return json({ success: true, message: `Plan updated to ${PLANS[newPlan].name}.` });
    }
    return json({ success: false, error: "Invalid plan." });
  }
  if (intent === "update_locale") {
    const locale = formData.get("locale");
    await prisma.shop.update({
      where: { id: shop.id },
      data: { locale }
    });
    return json({ success: true, message: "Language preference updated." });
  }
  return json({ success: false, error: "Unknown action" });
};
function SettingsPage() {
  var _a;
  const { shopDomain, planType, locale, usage, history, plans } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isProcessing = navigation.state !== "idle";
  const [selectedPlan, setSelectedPlan] = useState(planType);
  const [selectedLocale, setSelectedLocale] = useState(locale);
  const handleUpdatePlan = useCallback(() => {
    const formData = new FormData();
    formData.set("intent", "update_plan");
    formData.set("plan", selectedPlan);
    submit(formData, { method: "post" });
  }, [selectedPlan, submit]);
  const handleUpdateLocale = useCallback(() => {
    const formData = new FormData();
    formData.set("intent", "update_locale");
    formData.set("locale", selectedLocale);
    submit(formData, { method: "post" });
  }, [selectedLocale, submit]);
  const planRows = plans.map((plan) => [
    /* @__PURE__ */ jsxs(InlineStack, { gap: "200", align: "start", children: [
      /* @__PURE__ */ jsx(Text, { as: "p", fontWeight: "semibold", children: plan.name }),
      plan.isCurrent && /* @__PURE__ */ jsx(Badge, { tone: "success", children: "Current" })
    ] }, plan.key),
    plan.price === 0 ? "Free" : `$${plan.price}/mo`,
    `${plan.monthlyQuota} images`,
    plan.description,
    !plan.isCurrent ? /* @__PURE__ */ jsx(
      Button,
      {
        size: "slim",
        variant: plan.key === selectedPlan ? "primary" : "plain",
        onClick: () => setSelectedPlan(plan.key),
        children: plan.key === selectedPlan ? "Selected" : "Select"
      }
    ) : /* @__PURE__ */ jsx(Badge, { tone: "info", children: "Active" })
  ]);
  const usageRows = history.slice(0, 14).map((h) => [
    h.date,
    String(h.imagesGenerated),
    String(h.apiCalls)
  ]);
  return /* @__PURE__ */ jsx(Page, { title: "Settings", subtitle: "Manage your plan and preferences", children: /* @__PURE__ */ jsxs(Layout, { children: [
    (actionData == null ? void 0 : actionData.success) && /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Banner, { title: "Success", tone: "success", children: /* @__PURE__ */ jsx(Text, { as: "p", children: actionData.message }) }) }),
    actionData && !actionData.success && /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Banner, { title: "Error", tone: "critical", children: /* @__PURE__ */ jsx(Text, { as: "p", children: "error" in actionData ? actionData.error : "An error occurred." }) }) }),
    /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
      /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Subscription Plans" }),
      /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", tone: "subdued", children: "Choose the plan that fits your store's needs." }),
      /* @__PURE__ */ jsx(
        DataTable,
        {
          columnContentTypes: ["text", "text", "text", "text", "text"],
          headings: ["Plan", "Price", "Quota", "Description", "Action"],
          rows: planRows
        }
      ),
      selectedPlan !== planType && /* @__PURE__ */ jsx(
        Button,
        {
          variant: "primary",
          onClick: handleUpdatePlan,
          disabled: isProcessing,
          children: isProcessing ? "Updating..." : `Switch to ${((_a = PLANS[selectedPlan]) == null ? void 0 : _a.name) || selectedPlan}`
        }
      )
    ] }) }) }),
    /* @__PURE__ */ jsx(Layout.Section, { variant: "oneHalf", children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
      /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Language Preference" }),
      /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodySm", tone: "subdued", children: "AI-generated alt text will be created in this language." }),
      /* @__PURE__ */ jsxs(FormLayout, { children: [
        /* @__PURE__ */ jsx(
          Select,
          {
            label: "Alt Text Language",
            options: [
              { label: "English", value: "en" },
              { label: "Spanish", value: "es" },
              { label: "French", value: "fr" },
              { label: "German", value: "de" },
              { label: "Portuguese", value: "pt" },
              { label: "Japanese", value: "ja" },
              { label: "Chinese", value: "zh" },
              { label: "Korean", value: "ko" },
              { label: "Italian", value: "it" },
              { label: "Dutch", value: "nl" }
            ],
            value: selectedLocale,
            onChange: setSelectedLocale
          }
        ),
        selectedLocale !== locale && /* @__PURE__ */ jsx(
          Button,
          {
            variant: "primary",
            onClick: handleUpdateLocale,
            disabled: isProcessing,
            children: "Save Language"
          }
        )
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsx(Layout.Section, { variant: "oneHalf", children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
      /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Current Usage" }),
      /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
        /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", children: [
          /* @__PURE__ */ jsx(Text, { as: "p", children: "Plan" }),
          /* @__PURE__ */ jsx(Badge, { children: usage.planName })
        ] }),
        /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", children: [
          /* @__PURE__ */ jsx(Text, { as: "p", children: "Images Generated" }),
          /* @__PURE__ */ jsxs(Text, { as: "p", fontWeight: "semibold", children: [
            usage.imagesGenerated,
            " / ",
            usage.quota
          ] })
        ] }),
        /* @__PURE__ */ jsx(ProgressBar, { progress: usage.percentage / 100 }),
        /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", children: [
          /* @__PURE__ */ jsxs(Text, { as: "p", variant: "bodySm", tone: "subdued", children: [
            usage.quota - usage.imagesGenerated,
            " remaining"
          ] }),
          /* @__PURE__ */ jsxs(Text, { as: "p", variant: "bodySm", tone: "subdued", children: [
            usage.percentage,
            "% used"
          ] })
        ] })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
      /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Usage History (Last 14 Days)" }),
      usageRows.length === 0 ? /* @__PURE__ */ jsx(Text, { as: "p", tone: "subdued", children: "No usage data yet. Start generating alt text to see your history." }) : /* @__PURE__ */ jsx(
        DataTable,
        {
          columnContentTypes: ["text", "numeric", "numeric"],
          headings: ["Date", "Images Generated", "API Calls"],
          rows: usageRows
        }
      )
    ] }) }) }),
    /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "300", children: [
      /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Shop Information" }),
      /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", children: [
        /* @__PURE__ */ jsx(Text, { as: "p", tone: "subdued", children: "Shop Domain" }),
        /* @__PURE__ */ jsx(Text, { as: "p", children: shopDomain })
      ] }),
      /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", children: [
        /* @__PURE__ */ jsx(Text, { as: "p", tone: "subdued", children: "App Version" }),
        /* @__PURE__ */ jsx(Text, { as: "p", children: "1.0.0" })
      ] })
    ] }) }) })
  ] }) });
}
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$3,
  default: SettingsPage,
  loader: loader$5
}, Symbol.toStringTag, { value: "Module" }));
const loader$4 = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop }
  });
  if (!shop) {
    throw new Response("Shop not found", { status: 404 });
  }
  const [stats, usage] = await Promise.all([
    getDashboardStats(shop.id),
    getCurrentUsage(shop.id)
  ]);
  return {
    stats,
    usage,
    shopDomain: session.shop,
    planType: shop.planType
  };
};
function DashboardIndex() {
  const { stats, usage, shopDomain, planType } = useLoaderData();
  const quotaWarning = usage.percentage >= 80;
  const quotaCritical = usage.percentage >= 95;
  return /* @__PURE__ */ jsx(Page, { title: "Dashboard", subtitle: `Connected to ${shopDomain}`, children: /* @__PURE__ */ jsxs(Layout, { children: [
    quotaWarning && /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(
      Banner,
      {
        title: quotaCritical ? "Quota almost exhausted" : "Approaching monthly quota limit",
        tone: quotaCritical ? "critical" : "warning",
        children: /* @__PURE__ */ jsxs(Text, { as: "p", children: [
          "You have used ",
          usage.percentage,
          "% of your ",
          usage.planName,
          " plan quota (",
          usage.imagesGenerated,
          "/",
          usage.quota,
          " images).",
          quotaCritical && " Consider upgrading your plan."
        ] })
      }
    ) }),
    /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsxs(Grid, { columns: { xs: 1, sm: 2, md: 3, lg: 3, xl: 3 }, children: [
      /* @__PURE__ */ jsx(Grid.Cell, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
        /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodySm", tone: "subdued", children: "Total Products" }),
        /* @__PURE__ */ jsx(Text, { as: "h1", variant: "heading2xl", children: stats.totalProducts })
      ] }) }) }),
      /* @__PURE__ */ jsx(Grid.Cell, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
        /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodySm", tone: "subdued", children: "Total Images" }),
        /* @__PURE__ */ jsx(Text, { as: "h1", variant: "heading2xl", children: stats.totalImages })
      ] }) }) }),
      /* @__PURE__ */ jsx(Grid.Cell, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
        /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodySm", tone: "subdued", children: "Images with Alt Text" }),
        /* @__PURE__ */ jsx(Text, { as: "h1", variant: "heading2xl", children: stats.imagesWithAlt }),
        /* @__PURE__ */ jsxs(Text, { as: "p", variant: "bodySm", tone: "subdued", children: [
          stats.totalImages > 0 ? Math.round(stats.imagesWithAlt / stats.totalImages * 100) : 0,
          "% coverage"
        ] })
      ] }) }) })
    ] }) }),
    /* @__PURE__ */ jsx(Layout.Section, { variant: "oneHalf", children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
      /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "AI Generation Status" }),
      /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
        /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", children: [
          /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "Images Generated (This Month)" }),
          /* @__PURE__ */ jsxs(Badge, { tone: quotaCritical ? "critical" : quotaWarning ? "warning" : "success", children: [
            usage.imagesGenerated,
            " / ",
            usage.quota
          ] })
        ] }),
        /* @__PURE__ */ jsx(ProgressBar, { progress: usage.percentage / 100 }),
        /* @__PURE__ */ jsxs(Text, { as: "p", variant: "bodySm", tone: "subdued", children: [
          usage.quota - usage.imagesGenerated,
          " remaining"
        ] })
      ] }),
      /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
        /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", children: [
          /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "AI-Generated Alt Texts" }),
          /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", fontWeight: "semibold", children: stats.imagesWithAi })
        ] }),
        /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", children: [
          /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "Pending Review" }),
          /* @__PURE__ */ jsx(Badge, { tone: "info", children: stats.imagesPending })
        ] })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsx(Layout.Section, { variant: "oneHalf", children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
      /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Quick Actions" }),
      /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
        /* @__PURE__ */ jsx(Button, { url: "/app/products", variant: "primary", children: "View Products" }),
        /* @__PURE__ */ jsx(Button, { url: "/app/generate", children: "Generate Alt Text" }),
        /* @__PURE__ */ jsx(Button, { url: "/app/review", children: "Review Suggestions" }),
        /* @__PURE__ */ jsx(Button, { url: "/app/backup", children: "Backup Data" })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "300", children: [
      /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", children: [
        /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Current Plan" }),
        /* @__PURE__ */ jsx(Badge, { tone: "info", children: usage.planName })
      ] }),
      /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: planType === "free" ? "You are on the Free plan. Upgrade to generate more alt texts and unlock advanced features." : `You are on the ${usage.planName} plan with ${usage.quota} image generations per month.` }),
      /* @__PURE__ */ jsx(Box, { children: /* @__PURE__ */ jsx(Button, { url: "/app/settings", variant: "plain", children: "Manage Plan" }) })
    ] }) }) })
  ] }) });
}
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: DashboardIndex,
  loader: loader$4
}, Symbol.toStringTag, { value: "Module" }));
async function createBackup(shopId) {
  const products = await prisma.product.findMany({
    where: { shopId },
    include: {
      images: true
    }
  });
  const backupData = {
    products: products.map((p) => ({
      shopifyProductId: p.shopifyProductId,
      title: p.title,
      handle: p.handle,
      images: p.images.map((img) => ({
        shopifyImageId: img.shopifyImageId,
        src: img.src,
        altTextOriginal: img.altTextOriginal,
        altTextAi: img.altTextAi,
        status: img.status,
        tagsOriginal: img.tagsOriginal,
        tagsAi: img.tagsAi
      }))
    }))
  };
  const totalImages = products.reduce((sum, p) => sum + p.images.length, 0);
  const snapshot = await prisma.backupSnapshot.create({
    data: {
      shopId,
      recordCount: totalImages,
      data: JSON.stringify(backupData)
    }
  });
  return {
    id: snapshot.id,
    createdAt: snapshot.createdAt,
    recordCount: snapshot.recordCount
  };
}
async function listBackups(shopId) {
  const backups = await prisma.backupSnapshot.findMany({
    where: { shopId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      recordCount: true
    }
  });
  return backups;
}
async function restoreBackup(shopId, backupId) {
  const backup = await prisma.backupSnapshot.findFirst({
    where: { id: backupId, shopId }
  });
  if (!backup) {
    return { success: false, message: "Backup not found" };
  }
  const backupData = JSON.parse(backup.data);
  for (const productData of backupData.products) {
    const product = await prisma.product.findFirst({
      where: {
        shopId,
        shopifyProductId: productData.shopifyProductId
      }
    });
    if (!product) continue;
    for (const imageData of productData.images) {
      await prisma.productImage.updateMany({
        where: {
          productId: product.id,
          shopifyImageId: imageData.shopifyImageId
        },
        data: {
          altTextOriginal: imageData.altTextOriginal,
          altTextAi: imageData.altTextAi,
          status: imageData.status,
          tagsOriginal: imageData.tagsOriginal,
          tagsAi: imageData.tagsAi
        }
      });
    }
  }
  return {
    success: true,
    message: `Successfully restored ${backupData.products.length} products`
  };
}
async function deleteBackup(shopId, backupId) {
  await prisma.backupSnapshot.deleteMany({
    where: { id: backupId, shopId }
  });
}
async function exportToCsv(shopId) {
  const products = await prisma.product.findMany({
    where: { shopId },
    include: {
      images: true
    }
  });
  const rows = [];
  rows.push("Product Title,Product Handle,Image ID,Image URL,Original Alt Text,AI Alt Text,Status,Original Tags,AI Tags");
  for (const product of products) {
    for (const image of product.images) {
      const row = [
        `"${product.title.replace(/"/g, '""')}"`,
        product.handle,
        image.shopifyImageId,
        image.src,
        `"${(image.altTextOriginal || "").replace(/"/g, '""')}"`,
        `"${(image.altTextAi || "").replace(/"/g, '""')}"`,
        image.status,
        `"${(image.tagsOriginal || "").replace(/"/g, '""')}"`,
        `"${(image.tagsAi || "").replace(/"/g, '""')}"`
      ];
      rows.push(row.join(","));
    }
  }
  return rows.join("\n");
}
const loader$3 = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop }
  });
  if (!shop) {
    throw new Response("Shop not found", { status: 404 });
  }
  const backups = await listBackups(shop.id);
  return {
    backups: backups.map((b) => ({
      id: b.id,
      createdAt: b.createdAt.toISOString(),
      recordCount: b.recordCount
    }))
  };
};
const action$2 = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop }
  });
  if (!shop) {
    throw new Response("Shop not found", { status: 404 });
  }
  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent === "create") {
    const backup = await createBackup(shop.id);
    return json({
      success: true,
      message: `Backup created with ${backup.recordCount} image records.`
    });
  }
  if (intent === "restore") {
    const backupId = parseInt(formData.get("backupId"), 10);
    const result = await restoreBackup(shop.id, backupId);
    return json({
      success: result.success,
      message: result.message
    });
  }
  if (intent === "delete") {
    const backupId = parseInt(formData.get("backupId"), 10);
    await deleteBackup(shop.id, backupId);
    return json({ success: true, message: "Backup deleted." });
  }
  if (intent === "export") {
    const csv = await exportToCsv(shop.id);
    return json({ success: true, csv });
  }
  return json({ success: false, error: "Unknown action" });
};
function BackupPage() {
  const { backups } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isProcessing = navigation.state !== "idle";
  const handleCreate = useCallback(() => {
    const formData = new FormData();
    formData.set("intent", "create");
    submit(formData, { method: "post" });
  }, [submit]);
  const handleRestore = useCallback(
    (backupId) => {
      const formData = new FormData();
      formData.set("intent", "restore");
      formData.set("backupId", String(backupId));
      submit(formData, { method: "post" });
    },
    [submit]
  );
  const handleDelete = useCallback(
    (backupId) => {
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
    if (!(actionData == null ? void 0 : actionData.csv)) return;
    const blob = new Blob([actionData.csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alt-optimizer-backup-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [actionData]);
  const rows = backups.map((backup) => [
    new Date(backup.createdAt).toLocaleString(),
    String(backup.recordCount),
    /* @__PURE__ */ jsxs(InlineStack, { gap: "100", children: [
      /* @__PURE__ */ jsx(
        Button,
        {
          size: "slim",
          onClick: () => handleRestore(backup.id),
          disabled: isProcessing,
          children: "Restore"
        }
      ),
      /* @__PURE__ */ jsx(
        Button,
        {
          size: "slim",
          tone: "critical",
          variant: "plain",
          onClick: () => handleDelete(backup.id),
          disabled: isProcessing,
          children: "Delete"
        }
      )
    ] }, backup.id)
  ]);
  return /* @__PURE__ */ jsx(
    Page,
    {
      title: "Backup & Restore",
      subtitle: "Create snapshots and export your alt text data",
      children: /* @__PURE__ */ jsxs(Layout, { children: [
        (actionData == null ? void 0 : actionData.success) && /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Banner, { title: "Success", tone: "success", children: /* @__PURE__ */ jsx(Text, { as: "p", children: actionData.message }) }) }),
        (actionData == null ? void 0 : actionData.csv) && /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Banner, { title: "CSV Export Ready", tone: "success", children: /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
          /* @__PURE__ */ jsx(Text, { as: "p", children: "Your CSV file has been generated." }),
          /* @__PURE__ */ jsx(Button, { onClick: handleDownloadCsv, variant: "primary", children: "Download CSV" })
        ] }) }) }),
        /* @__PURE__ */ jsx(Layout.Section, { variant: "oneHalf", children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
          /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Create Backup" }),
          /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "Create a snapshot of all current alt text, tags, and structured data. You can restore from any previous backup at any time." }),
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "primary",
              onClick: handleCreate,
              disabled: isProcessing,
              children: isProcessing ? "Creating..." : "Create Backup Now"
            }
          )
        ] }) }) }),
        /* @__PURE__ */ jsx(Layout.Section, { variant: "oneHalf", children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
          /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Export to CSV" }),
          /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "Export all alt text data to a CSV file for external use or backup. Includes product titles, image URLs, original and AI-generated alt text." }),
          /* @__PURE__ */ jsx(
            Button,
            {
              onClick: handleExport,
              disabled: isProcessing,
              children: isProcessing ? "Exporting..." : "Export CSV"
            }
          )
        ] }) }) }),
        /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
          /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Backup History" }),
          backups.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { heading: "No backups yet", children: /* @__PURE__ */ jsx(Text, { as: "p", children: "Create your first backup to start tracking changes." }) }) : /* @__PURE__ */ jsx(
            DataTable,
            {
              columnContentTypes: ["text", "numeric", "text"],
              headings: ["Created At", "Records", "Actions"],
              rows
            }
          )
        ] }) }) })
      ] })
    }
  );
}
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$2,
  default: BackupPage,
  loader: loader$3
}, Symbol.toStringTag, { value: "Module" }));
const loader$2 = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop }
  });
  if (!shop) {
    throw new Response("Shop not found", { status: 404 });
  }
  const url = new URL(request.url);
  const filter = url.searchParams.get("filter") || "pending";
  const imagesWhere = {
    altTextAi: { not: null }
  };
  if (filter !== "all") {
    imagesWhere.status = filter;
  }
  const images = await prisma.productImage.findMany({
    where: imagesWhere,
    include: {
      product: {
        select: {
          title: true,
          handle: true
        }
      }
    },
    orderBy: { id: "desc" },
    take: 100
  });
  const counts = await prisma.productImage.groupBy({
    by: ["status"],
    where: { altTextAi: { not: null } },
    _count: true
  });
  const statusCounts = {
    pending: 0,
    approved: 0,
    rejected: 0
  };
  for (const group of counts) {
    if (group.status in statusCounts) {
      statusCounts[group.status] = group._count;
    }
  }
  return {
    images: images.map((img) => ({
      id: img.id,
      src: img.src,
      altTextOriginal: img.altTextOriginal,
      altTextAi: img.altTextAi,
      status: img.status,
      shopifyImageId: img.shopifyImageId,
      productTitle: img.product.title,
      productHandle: img.product.handle
    })),
    filter,
    statusCounts
  };
};
const action$1 = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop }
  });
  if (!shop) {
    throw new Response("Shop not found", { status: 404 });
  }
  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent === "approve") {
    const imageIds = formData.getAll("imageIds");
    let approved = 0;
    for (const imageIdStr of imageIds) {
      const imageId = parseInt(imageIdStr, 10);
      const image = await prisma.productImage.findUnique({
        where: { id: imageId }
      });
      if (!image || !image.altTextAi) continue;
      const success = await updateImageAltText(admin, image.shopifyImageId, image.altTextAi);
      if (success) {
        await prisma.productImage.update({
          where: { id: imageId },
          data: {
            altTextOriginal: image.altTextAi,
            status: "applied"
          }
        });
        await prisma.altTextHistory.create({
          data: {
            imageId,
            altText: image.altTextAi,
            source: "ai"
          }
        });
        approved++;
      }
    }
    return json({ success: true, approved });
  }
  if (intent === "reject") {
    const imageIds = formData.getAll("imageIds");
    for (const imageIdStr of imageIds) {
      const imageId = parseInt(imageIdStr, 10);
      await prisma.productImage.update({
        where: { id: imageId },
        data: { status: "rejected" }
      });
    }
    return json({ success: true, rejected: imageIds.length });
  }
  if (intent === "edit") {
    const imageId = parseInt(formData.get("imageId"), 10);
    const newAltText = formData.get("altText");
    const image = await prisma.productImage.findUnique({
      where: { id: imageId }
    });
    if (!image) {
      return json({ success: false, error: "Image not found" });
    }
    await prisma.productImage.update({
      where: { id: imageId },
      data: { altTextAi: newAltText }
    });
    const autoApply = formData.get("autoApply") === "true";
    if (autoApply) {
      const success = await updateImageAltText(admin, image.shopifyImageId, newAltText);
      if (success) {
        await prisma.productImage.update({
          where: { id: imageId },
          data: {
            altTextOriginal: newAltText,
            status: "applied"
          }
        });
      }
    }
    return json({ success: true });
  }
  if (intent === "bulk_approve") {
    const pendingImages = await prisma.productImage.findMany({
      where: {
        product: { shopId: shop.id },
        status: "pending",
        altTextAi: { not: null }
      }
    });
    let approved = 0;
    for (const image of pendingImages) {
      if (!image.altTextAi) continue;
      const success = await updateImageAltText(admin, image.shopifyImageId, image.altTextAi);
      if (success) {
        await prisma.productImage.update({
          where: { id: image.id },
          data: {
            altTextOriginal: image.altTextAi,
            status: "applied"
          }
        });
        approved++;
      }
    }
    return json({ success: true, approved });
  }
  return json({ success: false, error: "Unknown action" });
};
function ReviewPage() {
  const { images, filter, statusCounts } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isProcessing = navigation.state !== "idle";
  const [selectedFilter, setSelectedFilter] = useState(filter);
  const [editingImage, setEditingImage] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [selectedResources, setSelectedResources] = useState([]);
  const handleFilterChange = useCallback(
    (value) => {
      setSelectedFilter(value);
      const params = new URLSearchParams();
      if (value !== "pending") params.set("filter", value);
      submit(params, { method: "get" });
    },
    [submit]
  );
  const handleApprove = useCallback(
    (ids) => {
      const formData = new FormData();
      formData.set("intent", "approve");
      ids.forEach((id) => formData.append("imageIds", id));
      submit(formData, { method: "post" });
    },
    [submit]
  );
  const handleReject = useCallback(
    (ids) => {
      const formData = new FormData();
      formData.set("intent", "reject");
      ids.forEach((id) => formData.append("imageIds", id));
      submit(formData, { method: "post" });
    },
    [submit]
  );
  const handleBulkApprove = useCallback(() => {
    const formData = new FormData();
    formData.set("intent", "bulk_approve");
    submit(formData, { method: "post" });
  }, [submit]);
  const handleEdit = useCallback((id, altText) => {
    setEditingImage({ id, altText });
    setEditValue(altText);
  }, []);
  const handleSaveEdit = useCallback(() => {
    if (!editingImage) return;
    const formData = new FormData();
    formData.set("intent", "edit");
    formData.set("imageId", String(editingImage.id));
    formData.set("altText", editValue);
    formData.set("autoApply", "true");
    submit(formData, { method: "post" });
    setEditingImage(null);
  }, [editingImage, editValue, submit]);
  useCallback((id) => {
    setSelectedResources(
      (prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  }, []);
  const toggleAll = useCallback(() => {
    if (selectedResources.length === images.length) {
      setSelectedResources([]);
    } else {
      setSelectedResources(images.map((img) => String(img.id)));
    }
  }, [images, selectedResources.length]);
  return /* @__PURE__ */ jsxs(
    Page,
    {
      title: "Review & Approve",
      subtitle: "Review AI-generated alt text before applying to your store",
      primaryAction: statusCounts.pending > 0 ? /* @__PURE__ */ jsxs(Button, { variant: "primary", onClick: handleBulkApprove, disabled: isProcessing, children: [
        "Approve All Pending (",
        statusCounts.pending,
        ")"
      ] }) : void 0,
      children: [
        /* @__PURE__ */ jsxs(Layout, { children: [
          (actionData == null ? void 0 : actionData.success) && /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Banner, { title: "Success", tone: "success", children: /* @__PURE__ */ jsx(Text, { as: "p", children: "approved" in actionData ? `Approved ${actionData.approved} images.` : "Operation completed successfully." }) }) }),
          /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
            /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", blockAlign: "center", children: [
              /* @__PURE__ */ jsxs(InlineStack, { gap: "300", children: [
                /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Alt Text Review" }),
                /* @__PURE__ */ jsxs(InlineStack, { gap: "100", children: [
                  /* @__PURE__ */ jsxs(Badge, { tone: "info", children: [
                    "Pending: ",
                    statusCounts.pending
                  ] }),
                  /* @__PURE__ */ jsxs(Badge, { tone: "success", children: [
                    "Applied: ",
                    statusCounts.approved
                  ] }),
                  /* @__PURE__ */ jsxs(Badge, { tone: "critical", children: [
                    "Rejected: ",
                    statusCounts.rejected
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsx(
                Select,
                {
                  label: "",
                  labelInline: true,
                  options: [
                    { label: "Pending Review", value: "pending" },
                    { label: "All", value: "all" },
                    { label: "Applied", value: "approved" },
                    { label: "Rejected", value: "rejected" }
                  ],
                  value: selectedFilter,
                  onChange: handleFilterChange
                }
              )
            ] }),
            images.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { heading: "No images to review", children: /* @__PURE__ */ jsx(Text, { as: "p", children: filter === "pending" ? "All images have been reviewed. Generate more alt text to review." : "No images match the selected filter." }) }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs(InlineStack, { gap: "200", children: [
                /* @__PURE__ */ jsxs(
                  Button,
                  {
                    onClick: () => handleApprove(selectedResources),
                    disabled: selectedResources.length === 0 || isProcessing,
                    variant: "primary",
                    children: [
                      "Approve Selected (",
                      selectedResources.length,
                      ")"
                    ]
                  }
                ),
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    onClick: () => handleReject(selectedResources),
                    disabled: selectedResources.length === 0 || isProcessing,
                    tone: "critical",
                    children: "Reject Selected"
                  }
                )
              ] }),
              /* @__PURE__ */ jsx(
                IndexTable,
                {
                  resourceName: { singular: "image", plural: "images" },
                  itemCount: images.length,
                  selectedItemsCount: selectedResources.length,
                  onSelectionChange: (selectionType, toggleIds) => {
                    if (selectionType === "page") {
                      toggleAll();
                    }
                  },
                  headings: [
                    { title: "Image" },
                    { title: "Product" },
                    { title: "Current Alt Text" },
                    { title: "AI Suggested" },
                    { title: "Status" },
                    { title: "Actions" }
                  ],
                  children: images.map((image, index) => /* @__PURE__ */ jsxs(
                    IndexTable.Row,
                    {
                      id: String(image.id),
                      selected: selectedResources.includes(String(image.id)),
                      position: index,
                      children: [
                        /* @__PURE__ */ jsx(IndexTable.Cell, { children: /* @__PURE__ */ jsx(
                          Thumbnail,
                          {
                            source: image.src,
                            alt: image.altTextOriginal || "Product image",
                            size: "small"
                          }
                        ) }),
                        /* @__PURE__ */ jsx(IndexTable.Cell, { children: /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", fontWeight: "semibold", children: image.productTitle }) }),
                        /* @__PURE__ */ jsx(IndexTable.Cell, { children: /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodySm", children: image.altTextOriginal || /* @__PURE__ */ jsx(Text, { as: "span", tone: "subdued", children: "No alt text" }) }) }),
                        /* @__PURE__ */ jsx(IndexTable.Cell, { children: /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodySm", color: "success", children: image.altTextAi }) }),
                        /* @__PURE__ */ jsx(IndexTable.Cell, { children: /* @__PURE__ */ jsx(
                          Badge,
                          {
                            tone: image.status === "applied" ? "success" : image.status === "rejected" ? "critical" : "info",
                            children: image.status
                          }
                        ) }),
                        /* @__PURE__ */ jsx(IndexTable.Cell, { children: /* @__PURE__ */ jsxs(InlineStack, { gap: "100", children: [
                          /* @__PURE__ */ jsx(
                            Button,
                            {
                              size: "slim",
                              variant: "plain",
                              onClick: () => handleApprove([String(image.id)]),
                              disabled: image.status === "applied",
                              children: "Approve"
                            }
                          ),
                          /* @__PURE__ */ jsx(
                            Button,
                            {
                              size: "slim",
                              variant: "plain",
                              onClick: () => handleEdit(image.id, image.altTextAi || ""),
                              children: "Edit"
                            }
                          ),
                          /* @__PURE__ */ jsx(
                            Button,
                            {
                              size: "slim",
                              variant: "plain",
                              tone: "critical",
                              onClick: () => handleReject([String(image.id)]),
                              disabled: image.status === "rejected",
                              children: "Reject"
                            }
                          )
                        ] }) })
                      ]
                    },
                    image.id
                  ))
                }
              )
            ] })
          ] }) }) })
        ] }),
        editingImage && /* @__PURE__ */ jsx(
          Modal,
          {
            open: true,
            onClose: () => setEditingImage(null),
            title: "Edit Alt Text",
            primaryAction: {
              content: "Save & Apply",
              onAction: handleSaveEdit
            },
            secondaryActions: [
              {
                content: "Cancel",
                onAction: () => setEditingImage(null)
              }
            ],
            children: /* @__PURE__ */ jsxs(Modal.Section, { children: [
              /* @__PURE__ */ jsx(
                TextField,
                {
                  label: "Alt Text",
                  value: editValue,
                  onChange: setEditValue,
                  maxLength: 125,
                  showCharacterCount: true,
                  multiline: 3,
                  autoComplete: "off"
                }
              ),
              /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodySm", tone: "subdued", children: "Maximum 125 characters for optimal accessibility." })
            ] })
          }
        )
      ]
    }
  );
}
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$1,
  default: ReviewPage,
  loader: loader$2
}, Symbol.toStringTag, { value: "Module" }));
const action = async ({ request, params }) => {
  const { topic, shop, session, admin, payload } = await authenticate.webhook(request);
  if (!admin) {
    throw new Response();
  }
  switch (topic) {
    case "APP_UNINSTALLED":
      await handleAppUninstalled(shop);
      break;
    case "SHOP_REDACT":
      await handleShopRedact(shop);
      break;
    case "CUSTOMERS_DATA_REQUEST":
      await handleCustomersDataRequest(shop);
      break;
    case "PRODUCTS_UPDATE":
    case "PRODUCTS_CREATE":
      break;
    default:
      console.log(`[AltOptimizer] Unhandled webhook topic: ${topic}`);
  }
  return new Response();
};
async function handleAppUninstalled(shop) {
  console.log(`[AltOptimizer] App uninstalled for shop: ${shop}`);
  const shopRecord = await prisma.shop.findUnique({
    where: { shopDomain: shop }
  });
  if (shopRecord) {
    await prisma.shop.update({
      where: { id: shopRecord.id },
      data: { status: "uninstalled" }
    });
  }
}
async function handleShopRedact(shop) {
  console.log(`[AltOptimizer] Shop data redact request for: ${shop}`);
  const shopRecord = await prisma.shop.findUnique({
    where: { shopDomain: shop }
  });
  if (shopRecord) {
    await prisma.product.deleteMany({ where: { shopId: shopRecord.id } });
    await prisma.backupSnapshot.deleteMany({ where: { shopId: shopRecord.id } });
    await prisma.usageMetric.deleteMany({ where: { shopId: shopRecord.id } });
    await prisma.shop.delete({ where: { id: shopRecord.id } });
  }
}
async function handleCustomersDataRequest(shop, payload) {
  console.log(`[AltOptimizer] Customer data request for shop: ${shop}`);
}
const route7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action
}, Symbol.toStringTag, { value: "Module" }));
const loader$1 = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  let shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop }
  });
  if (!shop) {
    shop = await prisma.shop.create({
      data: {
        shopDomain: session.shop,
        accessToken: session.accessToken || "",
        planType: "free",
        status: "active"
      }
    });
  }
  return null;
};
const route8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$1
}, Symbol.toStringTag, { value: "Module" }));
function Boundary({ error: errorProp }) {
  var _a;
  const routeError = useRouteError();
  const error = errorProp || routeError;
  let title = "Something went wrong";
  let message = "An unexpected error occurred. Please try again.";
  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`;
    message = ((_a = error.data) == null ? void 0 : _a.message) || message;
  } else if (error instanceof Error) {
    message = error.message;
  }
  return /* @__PURE__ */ jsx(Page, { title: "Error", children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "300", children: [
    /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: title }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: message })
  ] }) }) });
}
const navItems = [
  { label: "Dashboard", url: "/app", matchPrefix: "/app" },
  { label: "Products", url: "/app/products", matchPrefix: "/app/products" },
  { label: "Generate", url: "/app/generate", matchPrefix: "/app/generate" },
  { label: "Review", url: "/app/review", matchPrefix: "/app/review" },
  { label: "Backup", url: "/app/backup", matchPrefix: "/app/backup" },
  { label: "Settings", url: "/app/settings", matchPrefix: "/app/settings" }
];
function AppNav() {
  const location = useLocation();
  return /* @__PURE__ */ jsx(
    Box,
    {
      padding: "300",
      borderColor: "border",
      borderWidth: "0 0 1 0",
      background: "bg-surface",
      children: /* @__PURE__ */ jsxs(InlineStack, { gap: "400", align: "start", blockAlign: "center", children: [
        /* @__PURE__ */ jsx(Text, { as: "h1", variant: "headingMd", fontWeight: "bold", children: "AltOptimizer" }),
        /* @__PURE__ */ jsx(InlineStack, { gap: "100", children: navItems.map((item) => {
          const isActive = item.matchPrefix === "/app" ? location.pathname === "/app" : location.pathname.startsWith(item.matchPrefix);
          return /* @__PURE__ */ jsx(
            Link,
            {
              to: item.url,
              style: {
                textDecoration: "none",
                padding: "8px 12px",
                borderRadius: "6px",
                backgroundColor: isActive ? "var(--p-color-bg-fill-brand)" : "transparent",
                color: isActive ? "var(--p-color-text-inverse)" : "var(--p-color-text)",
                fontSize: "14px",
                fontWeight: isActive ? 600 : 400,
                transition: "all 0.15s ease"
              },
              children: item.label
            },
            item.url
          );
        }) })
      ] })
    }
  );
}
const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};
function AppLayout() {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(AppNav, {}),
    /* @__PURE__ */ jsx(Outlet, {})
  ] });
}
function ErrorBoundary() {
  const error = useRouteError();
  return /* @__PURE__ */ jsx(Boundary, { error });
}
const headers = (headersParams) => {
  return shopify.addDocumentResponseHeaders(headersParams);
};
const route9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  default: AppLayout,
  headers,
  loader
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-BA3JXWZ0.js", "imports": ["/assets/components-zjYcV_oK.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/root-CHlt5EaS.js", "imports": ["/assets/components-zjYcV_oK.js", "/assets/context-DXW_CJV0.js", "/assets/context-BS_Je5Ip.js"], "css": [] }, "routes/app.generate": { "id": "routes/app.generate", "parentId": "routes/app", "path": "generate", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.generate-Ct-1hIPW.js", "imports": ["/assets/components-zjYcV_oK.js", "/assets/use-index-resource-state-C21JKJxH.js", "/assets/Page-D72GGr1Q.js", "/assets/Layout-Bj1CSlqc.js", "/assets/Banner-DXa2cVqu.js", "/assets/FormLayout-COBlDGUS.js", "/assets/Select-D3roPr4l.js", "/assets/Thumbnail-CfqSQdnO.js", "/assets/context-DXW_CJV0.js", "/assets/Image-CkTLJMMF.js", "/assets/Sticky-BR5DPMm0.js", "/assets/CSSTransition-Cosia9D7.js"], "css": [] }, "routes/app.products": { "id": "routes/app.products", "parentId": "routes/app", "path": "products", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.products-BsHYe_RN.js", "imports": ["/assets/components-zjYcV_oK.js", "/assets/use-index-resource-state-C21JKJxH.js", "/assets/Page-D72GGr1Q.js", "/assets/Thumbnail-CfqSQdnO.js", "/assets/Layout-Bj1CSlqc.js", "/assets/Select-D3roPr4l.js", "/assets/EmptyState-BxLnGGWW.js", "/assets/context-DXW_CJV0.js", "/assets/Image-CkTLJMMF.js", "/assets/Sticky-BR5DPMm0.js", "/assets/CSSTransition-Cosia9D7.js"], "css": [] }, "routes/app.settings": { "id": "routes/app.settings", "parentId": "routes/app", "path": "settings", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.settings-DpDOHW_v.js", "imports": ["/assets/components-zjYcV_oK.js", "/assets/Page-D72GGr1Q.js", "/assets/Layout-Bj1CSlqc.js", "/assets/Banner-DXa2cVqu.js", "/assets/DataTable-C6mo0F9e.js", "/assets/FormLayout-COBlDGUS.js", "/assets/Select-D3roPr4l.js", "/assets/ProgressBar-BpgfY8eo.js", "/assets/context-DXW_CJV0.js", "/assets/Sticky-BR5DPMm0.js", "/assets/CSSTransition-Cosia9D7.js"], "css": [] }, "routes/app._index": { "id": "routes/app._index", "parentId": "routes/app", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app._index-CBd2VGg-.js", "imports": ["/assets/components-zjYcV_oK.js", "/assets/Page-D72GGr1Q.js", "/assets/Layout-Bj1CSlqc.js", "/assets/Banner-DXa2cVqu.js", "/assets/ProgressBar-BpgfY8eo.js", "/assets/context-DXW_CJV0.js", "/assets/CSSTransition-Cosia9D7.js"], "css": [] }, "routes/app.backup": { "id": "routes/app.backup", "parentId": "routes/app", "path": "backup", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.backup-6rsCorPU.js", "imports": ["/assets/components-zjYcV_oK.js", "/assets/Page-D72GGr1Q.js", "/assets/Layout-Bj1CSlqc.js", "/assets/Banner-DXa2cVqu.js", "/assets/EmptyState-BxLnGGWW.js", "/assets/DataTable-C6mo0F9e.js", "/assets/context-DXW_CJV0.js", "/assets/Image-CkTLJMMF.js", "/assets/Sticky-BR5DPMm0.js"], "css": [] }, "routes/app.review": { "id": "routes/app.review", "parentId": "routes/app", "path": "review", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.review-Cud3XroD.js", "imports": ["/assets/components-zjYcV_oK.js", "/assets/Page-D72GGr1Q.js", "/assets/Layout-Bj1CSlqc.js", "/assets/Banner-DXa2cVqu.js", "/assets/Select-D3roPr4l.js", "/assets/EmptyState-BxLnGGWW.js", "/assets/Thumbnail-CfqSQdnO.js", "/assets/context-DXW_CJV0.js", "/assets/context-BS_Je5Ip.js", "/assets/CSSTransition-Cosia9D7.js", "/assets/Image-CkTLJMMF.js", "/assets/Sticky-BR5DPMm0.js"], "css": [] }, "routes/webhooks": { "id": "routes/webhooks", "parentId": "root", "path": "webhooks", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/webhooks-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/auth.$": { "id": "routes/auth.$", "parentId": "root", "path": "auth/*", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/auth._-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/app": { "id": "routes/app", "parentId": "root", "path": "app", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": true, "module": "/assets/app-DlIcuejB.js", "imports": ["/assets/components-zjYcV_oK.js", "/assets/Page-D72GGr1Q.js", "/assets/context-DXW_CJV0.js"], "css": [] } }, "url": "/assets/manifest-7ff454be.js", "version": "7ff454be" };
const mode = "production";
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "v3_fetcherPersist": false, "v3_relativeSplatPath": false, "v3_throwAbortReason": false, "v3_routeConfig": false, "v3_singleFetch": false, "v3_lazyRouteDiscovery": false, "unstable_optimizeDeps": false };
const isSpaMode = false;
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/app.generate": {
    id: "routes/app.generate",
    parentId: "routes/app",
    path: "generate",
    index: void 0,
    caseSensitive: void 0,
    module: route1
  },
  "routes/app.products": {
    id: "routes/app.products",
    parentId: "routes/app",
    path: "products",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/app.settings": {
    id: "routes/app.settings",
    parentId: "routes/app",
    path: "settings",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/app._index": {
    id: "routes/app._index",
    parentId: "routes/app",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route4
  },
  "routes/app.backup": {
    id: "routes/app.backup",
    parentId: "routes/app",
    path: "backup",
    index: void 0,
    caseSensitive: void 0,
    module: route5
  },
  "routes/app.review": {
    id: "routes/app.review",
    parentId: "routes/app",
    path: "review",
    index: void 0,
    caseSensitive: void 0,
    module: route6
  },
  "routes/webhooks": {
    id: "routes/webhooks",
    parentId: "root",
    path: "webhooks",
    index: void 0,
    caseSensitive: void 0,
    module: route7
  },
  "routes/auth.$": {
    id: "routes/auth.$",
    parentId: "root",
    path: "auth/*",
    index: void 0,
    caseSensitive: void 0,
    module: route8
  },
  "routes/app": {
    id: "routes/app",
    parentId: "root",
    path: "app",
    index: void 0,
    caseSensitive: void 0,
    module: route9
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  mode,
  publicPath,
  routes
};
