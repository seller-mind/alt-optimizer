import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "stream";
import { createReadableStreamFromReadable, json as json$1 } from "@remix-run/node";
import { RemixServer, Meta, Links, Outlet, ScrollRestoration, Scripts, useRouteError, isRouteErrorResponse, useLoaderData, useActionData, useSubmit, useNavigation, json, useNavigate, useLocation, Link } from "@remix-run/react";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { Page, Card, EmptyState, Text, useIndexResourceState, Modal, BlockStack, Banner, InlineStack, Badge, Layout, FormLayout, Select, ChoiceList, Button, IndexTable, Thumbnail, List, Frame, SkeletonBodyText, Toast, DataTable, ProgressBar, Box as Box$1, Icon, Grid, ButtonGroup, Tabs, Tooltip, TextField } from "@shopify/polaris";
import { useState, useCallback, useMemo } from "react";
import "@shopify/shopify-app-remix/adapters/node";
import { shopifyApp, AppDistribution, ApiVersion } from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import { CheckCircleIcon } from "@shopify/polaris-icons";
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
function ErrorBoundary$1() {
  const error = useRouteError();
  let title = "Something went wrong";
  let description = "An unexpected error occurred. Please try again.";
  if (isRouteErrorResponse(error)) {
    title = `Error ${error.status}`;
    description = error.status === 404 ? "The page you're looking for doesn't exist." : error.status === 403 ? "You don't have permission to access this page." : error.statusText || description;
  } else if (error instanceof Error) {
    description = error.message || description;
  }
  return /* @__PURE__ */ jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsxs("head", { children: [
      /* @__PURE__ */ jsx("meta", { charSet: "utf-8" }),
      /* @__PURE__ */ jsx("meta", { name: "viewport", content: "width=device-width, initial-scale=1" }),
      /* @__PURE__ */ jsx("title", { children: "AltOptimizer - Error" }),
      /* @__PURE__ */ jsx(Meta, {}),
      /* @__PURE__ */ jsx(Links, {}),
      /* @__PURE__ */ jsx("link", { rel: "stylesheet", href: polarisStyles })
    ] }),
    /* @__PURE__ */ jsxs("body", { children: [
      /* @__PURE__ */ jsx(AppProvider, { i18n: en, isEmbeddedApp: true, children: /* @__PURE__ */ jsx(Page, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(
        EmptyState,
        {
          heading: title,
          action: { content: "Try Again", onAction: () => window.location.reload() },
          children: /* @__PURE__ */ jsx(Text, { as: "p", children: description })
        }
      ) }) }) }),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary: ErrorBoundary$1,
  default: App,
  links
}, Symbol.toStringTag, { value: "Module" }));
const prisma = globalThis.__prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
function getShopifyConfig() {
  const apiKey = process.env.SHOPIFY_API_KEY;
  const apiSecretKey = process.env.SHOPIFY_API_SECRET;
  const appUrl = process.env.SHOPIFY_APP_URL || process.env.HOST || "https://localhost:5000";
  return {
    apiKey: apiKey || "",
    apiSecretKey: apiSecretKey || "",
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
    appUrl,
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
      },
      APP_SUBSCRIPTIONS_UPDATE: {
        deliveryMethod: "http",
        callbackUrl: "/webhooks/billing/update"
      },
      APP_SUBSCRIPTIONS_DECLINE: {
        deliveryMethod: "http",
        callbackUrl: "/webhooks/billing/decline"
      }
    },
    future: {
      unstable_newEmbeddedAuthStrategy: true
    }
  };
}
let _shopify = null;
function getShopify() {
  if (!_shopify) {
    const config = getShopifyConfig();
    if (!config.apiKey || !config.apiSecretKey) {
      throw new Error(
        "Shopify app not configured. Set SHOPIFY_API_KEY and SHOPIFY_API_SECRET environment variables."
      );
    }
    _shopify = shopifyApp(config);
  }
  return _shopify;
}
function getShopifySafe() {
  try {
    return getShopify();
  } catch {
    return null;
  }
}
const authenticate = {
  admin: (request) => {
    const shopify = getShopify();
    return shopify.authenticate.admin(request);
  },
  webhook: (request) => {
    const shopify = getShopify();
    return shopify.authenticate.webhook(request);
  },
  public: (request) => {
    const shopify = getShopify();
    return shopify.authenticate.public(request);
  }
};
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ""
});
const MAX_RETRIES = 3;
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
function validateEnvironment() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY environment variable is not set. Please add it to your .env file. You can get an API key from https://platform.openai.com/api-keys"
    );
  }
}
async function analyzeImage(imageBase64, mimeType, productTitle, locale = "en") {
  var _a, _b;
  validateEnvironment();
  const localeInstruction = getLocaleInstruction(locale);
  const dataUrl = `data:${mimeType};base64,${imageBase64}`;
  const userMessage = productTitle ? `Product title: "${productTitle}"

${localeInstruction}` : localeInstruction;
  let lastError = null;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
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
      if (parsed.altText && parsed.altText.length > 0) {
        return {
          altText: parsed.altText.substring(0, 125),
          analysis: parsed.analysis || { objects: [], colors: [], context: "", category: "" }
        };
      }
      lastError = new Error("Empty alt text in response");
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (error instanceof OpenAI.RateLimitError || error instanceof OpenAI.APIError) {
        await new Promise((r) => setTimeout(r, 1e3 * (attempt + 1)));
      }
    }
  }
  return {
    altText: "",
    analysis: { objects: [], colors: [], context: "", category: "" }
  };
}
async function generateTags(imageBase64, mimeType, productTitle, productDescription, locale = "en") {
  var _a, _b;
  validateEnvironment();
  const localeInstruction = getLocaleInstruction(locale);
  const dataUrl = `data:${mimeType};base64,${imageBase64}`;
  const userMessage = `Product Title: "${productTitle}"
Product Description: "${productDescription || "No description available"}"

${localeInstruction}`;
  let lastError = null;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
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
      if (parsed.tags && Array.isArray(parsed.tags) && parsed.tags.length > 0) {
        return { tags: parsed.tags };
      }
      lastError = new Error("Empty tags in response");
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (error instanceof OpenAI.RateLimitError || error instanceof OpenAI.APIError) {
        await new Promise((r) => setTimeout(r, 1e3 * (attempt + 1)));
      }
    }
  }
  return { tags: [] };
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
class QuotaExceededError extends Error {
  constructor(planName, quota, usage, type) {
    super(`Quota exceeded for ${type}: ${usage}/${quota} used on ${planName} plan`);
    this.planName = planName;
    this.quota = quota;
    this.usage = usage;
    this.type = type;
    this.name = "QuotaExceededError";
  }
}
function getPlanByType(planType) {
  return PLANS[planType] || PLANS.free;
}
async function getCurrentUsage(shopId) {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) throw new Error("Shop not found");
  const plan = getPlanByType(shop.planType);
  const now = /* @__PURE__ */ new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const dateStr = monthStart.toISOString().split("T")[0];
  const metric = await prisma.usageMetric.findUnique({
    where: { shopId_date: { shopId, date: dateStr } }
  });
  const imagesGenerated = (metric == null ? void 0 : metric.imagesGenerated) || 0;
  const tagsGenerated = (metric == null ? void 0 : metric.tagsGenerated) || 0;
  const jsonLdGenerated = (metric == null ? void 0 : metric.jsonLdGenerated) || 0;
  const apiCalls = (metric == null ? void 0 : metric.apiCalls) || 0;
  const totalUsage = imagesGenerated + tagsGenerated + jsonLdGenerated;
  return {
    imagesGenerated,
    tagsGenerated,
    jsonLdGenerated,
    apiCalls,
    quota: plan.monthlyQuota,
    percentage: Math.min(100, Math.round(totalUsage / plan.monthlyQuota * 100)),
    planName: plan.name,
    planType: shop.planType,
    remaining: Math.max(0, plan.monthlyQuota - totalUsage)
  };
}
async function checkQuota(shopId, type = "images") {
  const usage = await getCurrentUsage(shopId);
  const plan = getPlanByType(usage.planType);
  usage.imagesGenerated + usage.tagsGenerated + usage.jsonLdGenerated;
  return {
    canGenerate: usage.remaining > 0,
    remaining: usage.remaining,
    quota: plan.monthlyQuota,
    planName: plan.name,
    planType: usage.planType,
    warning: usage.percentage >= 80,
    warning95: usage.percentage >= 95
  };
}
async function enforceQuota(shopId, type = "images") {
  const usage = await getCurrentUsage(shopId);
  const plan = getPlanByType(usage.planType);
  if (usage.remaining <= 0) {
    throw new QuotaExceededError(
      plan.name,
      plan.monthlyQuota,
      usage.imagesGenerated + usage.tagsGenerated + usage.jsonLdGenerated,
      type
    );
  }
}
async function incrementUsage(shopId, type = "images", count = 1) {
  const now = /* @__PURE__ */ new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const dateStr = monthStart.toISOString().split("T")[0];
  const incrementField = type === "images" ? { imagesGenerated: { increment: count } } : type === "tags" ? { tagsGenerated: { increment: count } } : { jsonLdGenerated: { increment: count } };
  await prisma.usageMetric.upsert({
    where: { shopId_date: { shopId, date: dateStr } },
    update: {
      ...incrementField,
      apiCalls: { increment: 1 }
    },
    create: {
      shopId,
      date: dateStr,
      imagesGenerated: type === "images" ? count : 0,
      tagsGenerated: type === "tags" ? count : 0,
      jsonLdGenerated: type === "jsonld" ? count : 0,
      apiCalls: 1
    }
  });
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
    tagsGenerated: m.tagsGenerated,
    jsonLdGenerated: m.jsonLdGenerated,
    apiCalls: m.apiCalls
  }));
}
async function deleteShopData(shopId) {
  await prisma.$transaction([
    prisma.altTextHistory.deleteMany({
      where: { image: { product: { shopId } } }
    }),
    prisma.productImage.deleteMany({
      where: { product: { shopId } }
    }),
    prisma.product.deleteMany({ where: { shopId } }),
    prisma.backupSnapshot.deleteMany({ where: { shopId } }),
    prisma.usageMetric.deleteMany({ where: { shopId } }),
    prisma.shop.delete({ where: { id: shopId } })
  ]);
}
const loader$a = async ({ request }) => {
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
    shopLocale: shop.locale,
    planType: shop.planType
  };
};
const action$6 = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop }
  });
  if (!shop) {
    throw new Response("Shop not found", { status: 404 });
  }
  const formData = await request.formData();
  const intent = formData.get("intent");
  try {
    if (intent === "generate_alt") await enforceQuota(shop.id, "images");
    else if (intent === "generate_tags") await enforceQuota(shop.id, "tags");
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      return json({
        success: false,
        quotaExceeded: true,
        error: `Monthly quota exceeded. You've used ${err.usage} of ${err.quota} on the ${err.planName} plan.`,
        planName: err.planName,
        quota: err.quota,
        usage: err.usage
      });
    }
    throw err;
  }
  if (intent === "generate_alt") {
    const imageIds = formData.getAll("imageIds");
    const autoApply = formData.get("autoApply") === "true";
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
          imageSrc: image.src,
          productTitle: image.product.title,
          altText: analysis.altText,
          success: true
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        let friendlyError = message;
        if (message.includes("429") || message.includes("rate limit")) {
          friendlyError = "OpenAI rate limit hit. Please wait a moment and try again.";
        } else if (message.includes("timeout") || message.includes("timed out")) {
          friendlyError = "Request timed out. The image may be too large. Try again.";
        } else if (message.includes("401") || message.includes("API key")) {
          friendlyError = "OpenAI API key is invalid or missing. Check your settings.";
        } else if (message.includes("invalid image") || message.includes("corrupt")) {
          friendlyError = "Invalid image data. Skipping this image.";
        }
        results.push({
          imageId,
          altText: "",
          success: false,
          error: friendlyError
        });
      }
    }
    const successCount = results.filter((r) => r.success).length;
    if (successCount > 0) {
      await incrementUsage(shop.id, "images", successCount);
    }
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
          productTitle: product.title,
          tags: tagResult.tags,
          success: true
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        results.push({
          productId,
          productTitle: product.title,
          tags: [],
          success: false,
          error: message
        });
      }
    }
    const successCount = results.filter((r) => r.success).length;
    if (successCount > 0) {
      await incrementUsage(shop.id, "tags", successCount);
    }
    return json({
      success: true,
      results
    });
  }
  if (intent === "generate_jsonld") {
    const productIds = formData.getAll("productIds");
    let successCount = 0;
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
        successCount++;
      } catch {
      }
    }
    if (successCount > 0) {
      await incrementUsage(shop.id, "jsonld", successCount);
    }
    return json({ success: true, generated: successCount });
  }
  return json({ success: false, error: "Unknown action" });
};
function GeneratePage() {
  const { products, quota, shopLocale, planType } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isGenerating = navigation.state !== "idle";
  const [generationType, setGenerationType] = useState("alt_text");
  const [autoApply, setAutoApply] = useState("false");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const allImageIds = products.flatMap((p) => p.images.map((img) => String(img.id)));
  const selectedResources = useIndexResourceState(products);
  const showQuotaModal = actionData && !actionData.success && actionData.quotaExceeded;
  const handleGenerate = useCallback(() => {
    const formData = new FormData();
    formData.set("intent", generationType === "alt_text" ? "generate_alt" : generationType === "tags" ? "generate_tags" : "generate_jsonld");
    formData.set("autoApply", autoApply);
    if (generationType === "alt_text") {
      const selectedImageIds = selectedResources.selectedResources.length > 0 ? products.filter((p) => selectedResources.selectedResources.includes(String(p.id))).flatMap((p) => p.images.map((img) => String(img.id))) : allImageIds;
      if (selectedImageIds.length === 0) return;
      selectedImageIds.forEach((id) => formData.append("imageIds", id));
    } else {
      const selectedProductIds = selectedResources.selectedResources.length > 0 ? selectedResources.selectedResources : products.map((p) => String(p.id));
      if (selectedProductIds.length === 0) return;
      selectedProductIds.forEach((id) => formData.append("productIds", id));
    }
    submit(formData, { method: "post" });
  }, [generationType, autoApply, selectedResources.selectedResources, products, allImageIds, submit]);
  return /* @__PURE__ */ jsxs(Page, { title: "AI Generation", subtitle: "Generate alt text, tags, and structured data", children: [
    /* @__PURE__ */ jsx(
      Modal,
      {
        open: showQuotaModal || showUpgradeModal,
        onClose: () => {
          setShowUpgradeModal(false);
        },
        title: "Plan Upgrade Required",
        primaryAction: {
          content: "View Plans",
          onAction: () => window.open("/app/settings", "_self")
        },
        secondaryActions: [{
          content: "Dismiss",
          onAction: () => setShowUpgradeModal(false)
        }],
        children: /* @__PURE__ */ jsx(Modal.Section, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
          /* @__PURE__ */ jsx(Banner, { tone: "warning", title: "Monthly quota exceeded", children: /* @__PURE__ */ jsx(Text, { as: "p", children: showQuotaModal && (actionData == null ? void 0 : actionData.error) }) }),
          /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingSm", children: "Available Plans" }),
          Object.entries(PLANS).filter(([key]) => key !== "free").map(([key, plan]) => /* @__PURE__ */ jsx(Card, { padding: "400", children: /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
            /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", wrap: false, children: [
              /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingMd", children: plan.name }),
              /* @__PURE__ */ jsxs(Text, { as: "p", variant: "headingLg", fontWeight: "bold", children: [
                "$",
                plan.price,
                /* @__PURE__ */ jsx(Text, { as: "span", variant: "bodySm", tone: "subdued", children: "/month" })
              ] })
            ] }),
            /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: plan.description }),
            /* @__PURE__ */ jsxs(Badge, { children: [
              plan.monthlyQuota,
              " generations/month"
            ] })
          ] }) }, key))
        ] }) })
      }
    ),
    /* @__PURE__ */ jsxs(Layout, { children: [
      quota.warning && /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(
        Banner,
        {
          title: quota.warning95 ? "Quota nearly exhausted" : "Quota warning",
          tone: quota.warning95 ? "critical" : "warning",
          action: {
            content: "Upgrade Plan",
            onAction: () => setShowUpgradeModal(true)
          },
          children: /* @__PURE__ */ jsxs(Text, { as: "p", children: [
            "You have used ",
            quota.percentage,
            "% of your monthly quota (",
            quota.remaining,
            " remaining).",
            quota.warning95 && " Please upgrade to avoid interruptions."
          ] })
        }
      ) }),
      actionData && actionData.success && /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Banner, { title: "Generation complete", tone: "success", onDismiss: () => {
      }, children: /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
        /* @__PURE__ */ jsx(Text, { as: "p", children: "generated" in actionData ? `Successfully generated ${actionData.generated} of ${actionData.total} alt texts.` : "Operation completed successfully." }),
        "results" in actionData && actionData.results && /* @__PURE__ */ jsx(Fragment, { children: actionData.results.filter((r) => !r.success).length > 0 && /* @__PURE__ */ jsxs(Text, { as: "p", tone: "critical", children: [
          actionData.results.filter((r) => !r.success).length,
          " failed. See details below."
        ] }) })
      ] }) }) }),
      actionData && !actionData.success && !actionData.quotaExceeded && /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Banner, { title: "Error", tone: "critical", children: /* @__PURE__ */ jsx(Text, { as: "p", children: "error" in actionData ? actionData.error : "An error occurred." }) }) }),
      /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
        /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", wrap: false, children: [
          /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Generation Settings" }),
          /* @__PURE__ */ jsxs(Badge, { tone: quota.remaining > 0 ? "success" : "critical", children: [
            quota.remaining,
            " quota remaining"
          ] })
        ] }),
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
                disabled: isGenerating || products.length === 0 || quota.remaining <= 0,
                loading: isGenerating,
                children: isGenerating ? "Generating..." : `Generate ${generationType === "alt_text" ? "Alt Text" : generationType === "tags" ? "Tags" : "JSON-LD"}`
              }
            )
          ] })
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
        /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Eligible Products" }),
        /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodySm", tone: "subdued", children: "Select specific products or leave all selected to generate for all eligible items." }),
        products.length === 0 ? /* @__PURE__ */ jsx(Text, { as: "p", alignment: "center", children: "All products have alt text. No generation needed." }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(
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
          ),
          (actionData == null ? void 0 : actionData.success) && "results" in actionData && actionData.results && /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
            /* @__PURE__ */ jsxs(Text, { as: "h3", variant: "headingSm", children: [
              "Generation Results (",
              actionData.results.filter((r) => r.success).length,
              " succeeded, ",
              actionData.results.filter((r) => !r.success).length,
              " failed)"
            ] }),
            actionData.results.filter((r) => !r.success).length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Banner, { tone: "critical", title: "Some items failed", children: /* @__PURE__ */ jsx(Text, { as: "p", children: "Failed items can be retried individually." }) }),
              /* @__PURE__ */ jsx(List, { type: "bullet", children: actionData.results.filter((r) => !r.success).map((r) => /* @__PURE__ */ jsx(List.Item, { children: /* @__PURE__ */ jsxs(InlineStack, { gap: "200", wrap: false, align: "space-between", children: [
                /* @__PURE__ */ jsxs(BlockStack, { gap: "100", children: [
                  /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodySm", fontWeight: "semibold", children: r.productTitle || `Image #${r.imageId}` }),
                  /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodySm", tone: "critical", children: r.error || "Unknown error" })
                ] }),
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    size: "slim",
                    variant: "plain",
                    onClick: () => {
                      const fd = new FormData();
                      fd.set("intent", "generate_alt");
                      fd.set("autoApply", autoApply);
                      fd.append("imageIds", String(r.imageId));
                      submit(fd, { method: "post" });
                    },
                    children: "Retry"
                  }
                )
              ] }) }, r.imageId || r.productId)) })
            ] })
          ] }) })
        ] })
      ] }) }) })
    ] })
  ] });
}
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$6,
  default: GeneratePage,
  loader: loader$a
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
const loader$9 = async ({ request }) => {
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
  if (intent === "sync") {
    const result = await syncProductsFromShopify(shop.id, admin);
    return json({ success: true, synced: result.synced });
  }
  return json({ success: false });
};
function ProductsPage() {
  var _a;
  const { products, filter, totalProducts } = useLoaderData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSyncing = navigation.state !== "idle" && ((_a = navigation.formData) == null ? void 0 : _a.get("intent")) === "sync";
  const [toastActive, setToastActive] = useState(false);
  const [toastContent, setToastContent] = useState("");
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
  const truncateTitle = (title, maxLen = 50) => {
    if (title.length <= maxLen) return title;
    return title.substring(0, maxLen) + "…";
  };
  const renderThumbnail = (src, alt) => {
    if (!src) {
      return /* @__PURE__ */ jsx(
        Box,
        {
          width: "40px",
          height: "40px",
          borderRadius: "100",
          background: "bg-surface-secondary",
          children: /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyXs", alignment: "center", tone: "subdued", children: "—" })
        }
      );
    }
    return /* @__PURE__ */ jsx(
      Thumbnail,
      {
        source: src,
        alt,
        size: "small"
      }
    );
  };
  products.map((product) => {
    const altStatus = product.imageCount === 0 ? /* @__PURE__ */ jsx(Badge, { tone: "subdued", children: "No images" }) : product.missingAltCount === 0 ? /* @__PURE__ */ jsx(Badge, { tone: "success", children: "Complete" }) : product.hasAltText ? /* @__PURE__ */ jsx(Badge, { tone: "warning", children: "Partial" }) : /* @__PURE__ */ jsx(Badge, { tone: "critical", children: "Missing" });
    const imageCountDisplay = product.imageCount === 0 ? /* @__PURE__ */ jsx(Badge, { tone: "subdued", children: "No images" }) : /* @__PURE__ */ jsx(Text, { as: "p", children: product.imageCount });
    return [
      renderThumbnail(product.firstImage, product.title),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", fontWeight: "semibold", children: truncateTitle(product.title) }),
        /* @__PURE__ */ jsxs(Text, { as: "p", variant: "bodySm", tone: "subdued", children: [
          "/",
          product.handle
        ] })
      ] }),
      imageCountDisplay,
      altStatus,
      product.hasJsonLd ? /* @__PURE__ */ jsx(Badge, { tone: "success", children: "Yes" }) : /* @__PURE__ */ jsx(Badge, { tone: "subdued", children: "No" })
    ];
  });
  const toastMarkup = toastActive ? /* @__PURE__ */ jsx(Toast, { content: toastContent, onDismiss: () => setToastActive(false) }) : null;
  return /* @__PURE__ */ jsx(
    Page,
    {
      title: "Products",
      subtitle: `${totalProducts} products found`,
      primaryAction: /* @__PURE__ */ jsx(
        Button,
        {
          variant: "primary",
          onClick: handleSync,
          disabled: isSyncing,
          loading: isSyncing,
          children: isSyncing ? "Syncing…" : "Sync from Shopify"
        }
      ),
      children: /* @__PURE__ */ jsxs(Frame, { children: [
        toastMarkup,
        /* @__PURE__ */ jsx(Layout, { children: /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
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
          isSyncing ? /* @__PURE__ */ jsx(BlockStack, { gap: "300", children: Array.from({ length: 5 }).map((_, i) => /* @__PURE__ */ jsxs(InlineStack, { gap: "200", blockAlign: "center", children: [
            /* @__PURE__ */ jsx(Box, { width: "40px", height: "40px", borderRadius: "100", background: "bg-surface-secondary" }),
            /* @__PURE__ */ jsx(Box, { flex: 1, children: /* @__PURE__ */ jsx(SkeletonBodyText, { lines: 1 }) }),
            /* @__PURE__ */ jsx(Box, { width: "60px", children: /* @__PURE__ */ jsx(SkeletonBodyText, { lines: 1 }) })
          ] }, i)) }) : products.length === 0 ? /* @__PURE__ */ jsx(
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
                const altStatus = product.imageCount === 0 ? /* @__PURE__ */ jsx(Badge, { tone: "subdued", children: "No images" }) : product.missingAltCount === 0 ? /* @__PURE__ */ jsx(Badge, { tone: "success", children: "Complete" }) : product.hasAltText ? /* @__PURE__ */ jsx(Badge, { tone: "warning", children: "Partial" }) : /* @__PURE__ */ jsx(Badge, { tone: "critical", children: "Missing" });
                return /* @__PURE__ */ jsxs(
                  IndexTable.Row,
                  {
                    id: String(product.id),
                    selected: selectedResources.selectedResources.includes(String(product.id)),
                    position: index,
                    children: [
                      /* @__PURE__ */ jsx(IndexTable.Cell, { children: product.firstImage ? /* @__PURE__ */ jsx(
                        Thumbnail,
                        {
                          source: product.firstImage,
                          alt: product.title,
                          size: "small"
                        }
                      ) : /* @__PURE__ */ jsx(
                        Box,
                        {
                          width: "40px",
                          height: "40px",
                          borderRadius: "100",
                          background: "bg-surface-secondary",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          children: /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyXs", tone: "subdued", alignment: "center", children: "—" })
                        }
                      ) }),
                      /* @__PURE__ */ jsxs(IndexTable.Cell, { children: [
                        /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", fontWeight: "semibold", children: truncateTitle(product.title) }),
                        /* @__PURE__ */ jsxs(Text, { as: "p", variant: "bodySm", tone: "subdued", children: [
                          "/",
                          product.handle
                        ] })
                      ] }),
                      /* @__PURE__ */ jsx(IndexTable.Cell, { children: product.imageCount === 0 ? /* @__PURE__ */ jsx(Badge, { tone: "subdued", children: "No images" }) : /* @__PURE__ */ jsx(Text, { as: "p", children: product.imageCount }) }),
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
      ] })
    }
  );
}
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$5,
  default: ProductsPage,
  loader: loader$9
}, Symbol.toStringTag, { value: "Module" }));
const loader$8 = async ({ request }) => {
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
const action$4 = async ({ request }) => {
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
  if (intent === "delete_my_data") {
    await deleteShopData(shop.id);
    return json({ success: true, message: "All your data has been permanently deleted." });
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
    String(h.imagesGenerated + h.tagsGenerated + h.jsonLdGenerated),
    String(h.imagesGenerated),
    String(h.tagsGenerated),
    String(h.jsonLdGenerated),
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
          /* @__PURE__ */ jsx(Text, { as: "p", children: "Alt Text Generated" }),
          /* @__PURE__ */ jsx(Text, { as: "p", fontWeight: "semibold", children: usage.imagesGenerated })
        ] }),
        /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", children: [
          /* @__PURE__ */ jsx(Text, { as: "p", children: "Tags Generated" }),
          /* @__PURE__ */ jsx(Text, { as: "p", fontWeight: "semibold", children: usage.tagsGenerated })
        ] }),
        /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", children: [
          /* @__PURE__ */ jsx(Text, { as: "p", children: "JSON-LD Generated" }),
          /* @__PURE__ */ jsx(Text, { as: "p", fontWeight: "semibold", children: usage.jsonLdGenerated })
        ] }),
        /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", children: [
          /* @__PURE__ */ jsx(Text, { as: "p", children: "Total Usage" }),
          /* @__PURE__ */ jsxs(Text, { as: "p", fontWeight: "semibold", children: [
            usage.imagesGenerated + usage.tagsGenerated + usage.jsonLdGenerated,
            " / ",
            usage.quota
          ] })
        ] }),
        /* @__PURE__ */ jsx(ProgressBar, { progress: usage.percentage / 100 }),
        /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", children: [
          /* @__PURE__ */ jsxs(Text, { as: "p", variant: "bodySm", tone: "subdued", children: [
            usage.remaining,
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
          columnContentTypes: ["text", "numeric", "numeric", "numeric", "numeric", "numeric"],
          headings: ["Date", "Total", "Alt Text", "Tags", "JSON-LD", "API Calls"],
          rows: usageRows
        }
      )
    ] }) }) }),
    /* @__PURE__ */ jsx(Layout.Section, { variant: "oneHalf", children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "300", children: [
      /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Shop Information" }),
      /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", children: [
        /* @__PURE__ */ jsx(Text, { as: "p", tone: "subdued", children: "Shop Domain" }),
        /* @__PURE__ */ jsx(Text, { as: "p", children: shopDomain })
      ] }),
      /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", children: [
        /* @__PURE__ */ jsx(Text, { as: "p", tone: "subdued", children: "AI Provider" }),
        /* @__PURE__ */ jsx(Badge, { tone: "info", children: "OpenAI GPT-4o" })
      ] }),
      /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", children: [
        /* @__PURE__ */ jsx(Text, { as: "p", tone: "subdued", children: "App Version" }),
        /* @__PURE__ */ jsx(Text, { as: "p", children: "1.0.0" })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsx(Layout.Section, { variant: "oneHalf", children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
      /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", wrap: false, children: [
        /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", tone: "critical", children: "GDPR & Data Deletion" }),
        /* @__PURE__ */ jsx(Badge, { tone: "critical", children: "GDPR" })
      ] }),
      /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodySm", tone: "subdued", children: "AltOptimizer only stores product data, product images, and generated AI content. We do not collect customer data, order information, or personal data." }),
      /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodySm", tone: "subdued", children: "If you delete your data, all your products, images, alt text history, backups, and usage metrics will be permanently removed. This action cannot be undone." }),
      !showDeleteConfirm ? /* @__PURE__ */ jsx(
        Button,
        {
          tone: "critical",
          onClick: () => setShowDeleteConfirm(true),
          children: "Delete My Data"
        }
      ) : /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
        /* @__PURE__ */ jsx(Banner, { tone: "critical", title: "Are you sure?", children: /* @__PURE__ */ jsx(Text, { as: "p", children: "This will permanently delete all your store data from AltOptimizer. This cannot be undone." }) }),
        /* @__PURE__ */ jsxs(InlineStack, { gap: "200", children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              tone: "critical",
              variant: "primary",
              onClick: () => {
                const fd = new FormData();
                fd.set("intent", "delete_my_data");
                submit(fd, { method: "post" });
              },
              children: "Yes, Delete Everything"
            }
          ),
          /* @__PURE__ */ jsx(Button, { onClick: () => setShowDeleteConfirm(false), children: "Cancel" })
        ] })
      ] }),
      /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyXs", tone: "subdued", children: "Data retention policy: After uninstalling, your data is kept for 30 days. You can request immediate deletion at any time." })
    ] }) }) })
  ] }) });
}
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$4,
  default: SettingsPage,
  loader: loader$8
}, Symbol.toStringTag, { value: "Module" }));
const loader$7 = async ({ request }) => {
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
  const isNewUser = stats.totalProducts === 0;
  const showOnboarding = isNewUser || shop.onboardingStep !== "completed";
  const needsReview = stats.imagesPending > 0;
  const hasAiGenerated = stats.imagesWithAi > 0;
  return {
    stats,
    usage,
    shopDomain: session.shop,
    planType: shop.planType,
    showOnboarding,
    onboardingStep: shop.onboardingStep || "welcome",
    needsReview,
    hasAiGenerated,
    imagesWithoutAlt: stats.totalImages - stats.imagesWithAlt
  };
};
const action$3 = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent === "dismiss_onboarding") {
    await prisma.shop.update({
      where: { shopDomain: session.shop },
      data: { onboardingStep: "completed" }
    });
    return json({ success: true });
  }
  if (intent === "advance_onboarding") {
    const step = String(formData.get("step") || "welcome");
    await prisma.shop.update({
      where: { shopDomain: session.shop },
      data: { onboardingStep: step }
    });
    return json({ success: true });
  }
  return json({ success: false });
};
function DashboardIndex() {
  const {
    stats,
    usage,
    shopDomain,
    planType,
    showOnboarding,
    onboardingStep,
    needsReview,
    hasAiGenerated,
    imagesWithoutAlt
  } = useLoaderData();
  const navigate = useNavigate();
  const submit = useSubmit();
  useNavigation();
  const [onboardingOpen, setOnboardingOpen] = useState(showOnboarding);
  const quotaWarning = usage.percentage >= 80;
  const quotaCritical = usage.percentage >= 95;
  const altTextCoverage = stats.totalImages > 0 ? Math.round(stats.imagesWithAlt / stats.totalImages * 100) : 0;
  const dismissOnboarding = useCallback(() => {
    setOnboardingOpen(false);
    const formData = new FormData();
    formData.set("intent", "dismiss_onboarding");
    submit(formData, { method: "post" });
  }, [submit]);
  const advanceOnboarding = useCallback((step) => {
    const formData = new FormData();
    formData.set("intent", "advance_onboarding");
    formData.set("step", step);
    submit(formData, { method: "post" });
  }, [submit]);
  const onboardingModal = /* @__PURE__ */ jsx(
    Modal,
    {
      open: onboardingOpen,
      onClose: dismissOnboarding,
      title: "",
      large: true,
      titleHidden: true,
      children: /* @__PURE__ */ jsxs(Modal.Section, { children: [
        onboardingStep === "welcome" && /* @__PURE__ */ jsxs(BlockStack, { gap: "400", align: "center", children: [
          /* @__PURE__ */ jsx(Box$1, { paddingBlockStart: "400", children: /* @__PURE__ */ jsx(Icon, { source: CheckCircleIcon, tone: "success" }) }),
          /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingXl", alignment: "center", children: "Welcome to AltOptimizer! 🚀" }),
          /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyLg", alignment: "center", tone: "subdued", children: "Supercharge your Shopify store's SEO with AI-powered product image optimization" }),
          /* @__PURE__ */ jsx(BlockStack, { gap: "300", children: /* @__PURE__ */ jsxs(List, { type: "bullet", children: [
            /* @__PURE__ */ jsxs(List.Item, { children: [
              /* @__PURE__ */ jsx(Text, { as: "span", fontWeight: "semibold", children: "AI Alt Text Generation" }),
              " — GPT-4o analyzes your product images and generates SEO-optimized alt text under 125 characters"
            ] }),
            /* @__PURE__ */ jsxs(List.Item, { children: [
              /* @__PURE__ */ jsx(Text, { as: "span", fontWeight: "semibold", children: "Smart Product Tags" }),
              " — Automatically generate relevant tags based on image content, product title, and description"
            ] }),
            /* @__PURE__ */ jsxs(List.Item, { children: [
              /* @__PURE__ */ jsx(Text, { as: "span", fontWeight: "semibold", children: "JSON-LD Structured Data" }),
              " — Boost search visibility with Schema.org Product markup for every item"
            ] })
          ] }) }),
          /* @__PURE__ */ jsxs(InlineStack, { gap: "200", children: [
            /* @__PURE__ */ jsx(Button, { variant: "primary", onClick: () => {
              advanceOnboarding("sync");
            }, children: "Get Started →" }),
            /* @__PURE__ */ jsx(Button, { onClick: dismissOnboarding, children: "Skip" })
          ] })
        ] }),
        onboardingStep === "sync" && /* @__PURE__ */ jsxs(BlockStack, { gap: "400", align: "center", children: [
          /* @__PURE__ */ jsx(Box$1, { paddingBlockStart: "400", children: /* @__PURE__ */ jsx(Icon, { source: CheckCircleIcon, tone: "info" }) }),
          /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingXl", alignment: "center", children: "Sync Your Products" }),
          /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyLg", alignment: "center", tone: "subdued", children: "Import all products from your Shopify store to get started. We'll pull in product images, titles, and descriptions." }),
          /* @__PURE__ */ jsx(Box$1, { padding: "400", borderRadius: "200", background: "bg-surface-secondary", width: "100%", children: /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
            /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", fontWeight: "semibold", children: "What gets synced:" }),
            /* @__PURE__ */ jsxs(List, { type: "bullet", children: [
              /* @__PURE__ */ jsx(List.Item, { children: "All product images with existing alt text" }),
              /* @__PURE__ */ jsx(List.Item, { children: "Product titles, handles, and descriptions" }),
              /* @__PURE__ */ jsx(List.Item, { children: "Vendor, price, SKU, and currency information" })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxs(InlineStack, { gap: "200", children: [
            /* @__PURE__ */ jsx(Button, { variant: "primary", onClick: () => {
              advanceOnboarding("generate");
              navigate("/app/products");
            }, children: "Sync Products Now" }),
            /* @__PURE__ */ jsx(Button, { onClick: () => {
              advanceOnboarding("generate");
            }, children: "Skip, I'll do it later" })
          ] })
        ] }),
        onboardingStep === "generate" && /* @__PURE__ */ jsxs(BlockStack, { gap: "400", align: "center", children: [
          /* @__PURE__ */ jsx(Box$1, { paddingBlockStart: "400", children: /* @__PURE__ */ jsx(Icon, { source: CheckCircleIcon, tone: "success" }) }),
          /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingXl", alignment: "center", children: "Generate AI Alt Text" }),
          /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyLg", alignment: "center", tone: "subdued", children: "One click is all it takes. GPT-4o analyzes each product image and generates SEO-optimized alt text, relevant tags, and JSON-LD structured data." }),
          /* @__PURE__ */ jsx(Box$1, { padding: "400", borderRadius: "200", background: "bg-surface-secondary", width: "100%", children: /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
            /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", fontWeight: "semibold", children: "What you'll get:" }),
            /* @__PURE__ */ jsxs(List, { type: "bullet", children: [
              /* @__PURE__ */ jsx(List.Item, { children: "SEO-optimized alt text (under 125 characters)" }),
              /* @__PURE__ */ jsx(List.Item, { children: "Relevant product tags for discoverability" }),
              /* @__PURE__ */ jsx(List.Item, { children: "JSON-LD structured data for rich snippets" })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxs(InlineStack, { gap: "200", children: [
            /* @__PURE__ */ jsx(Button, { variant: "primary", onClick: () => {
              dismissOnboarding();
              navigate("/app/generate");
            }, children: "Generate Alt Text" }),
            /* @__PURE__ */ jsx(Button, { onClick: dismissOnboarding, children: "Done — take me to dashboard" })
          ] })
        ] })
      ] })
    }
  );
  return /* @__PURE__ */ jsxs(Page, { title: "Dashboard", subtitle: `Connected to ${shopDomain}`, children: [
    onboardingModal,
    /* @__PURE__ */ jsxs(Layout, { children: [
      quotaWarning && /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(
        Banner,
        {
          title: quotaCritical ? "Quota almost exhausted — upgrade to continue generating" : `Approaching your ${usage.planName} plan limit`,
          tone: quotaCritical ? "critical" : "warning",
          action: {
            content: "Upgrade Plan",
            url: "/app/settings"
          },
          children: /* @__PURE__ */ jsxs(Text, { as: "p", children: [
            "You've used ",
            usage.percentage,
            "% of your monthly quota (",
            usage.imagesGenerated,
            "/",
            usage.quota,
            " images).",
            quotaCritical && " Upgrade to avoid interruptions."
          ] })
        }
      ) }),
      stats.totalProducts === 0 && !onboardingOpen && /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(
        Banner,
        {
          title: "Welcome to AltOptimizer!",
          tone: "info",
          children: /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
            /* @__PURE__ */ jsx(Text, { as: "p", children: "Get started in 3 simple steps:" }),
            /* @__PURE__ */ jsxs(List, { type: "number", children: [
              /* @__PURE__ */ jsxs(List.Item, { children: [
                /* @__PURE__ */ jsx(Text, { as: "span", fontWeight: "semibold", children: "Sync your products" }),
                " — Import all products from your Shopify store"
              ] }),
              /* @__PURE__ */ jsxs(List.Item, { children: [
                /* @__PURE__ */ jsx(Text, { as: "span", fontWeight: "semibold", children: "Generate AI alt text" }),
                " — Let GPT-4o analyze your product images and suggest SEO-optimized alt text"
              ] }),
              /* @__PURE__ */ jsxs(List.Item, { children: [
                /* @__PURE__ */ jsx(Text, { as: "span", fontWeight: "semibold", children: "Review & apply" }),
                " — Review suggestions, edit if needed, and apply with one click"
              ] })
            ] }),
            /* @__PURE__ */ jsxs(InlineStack, { gap: "200", wrap: false, children: [
              /* @__PURE__ */ jsx(Button, { variant: "primary", onClick: () => navigate("/app/products"), children: "Sync Products Now" }),
              /* @__PURE__ */ jsx(Button, { onClick: () => navigate("/app/generate"), children: "Generate Alt Text" })
            ] })
          ] })
        }
      ) }),
      needsReview && stats.totalProducts > 0 && /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(
        Banner,
        {
          title: `${stats.imagesPending} images pending review`,
          tone: "info",
          action: {
            content: "Review Now",
            url: "/app/review"
          },
          children: /* @__PURE__ */ jsx(Text, { as: "p", children: "AI-generated alt text is ready for your review. Review and apply to optimize your store's SEO." })
        }
      ) }),
      /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsxs(Grid, { columns: { xs: 1, sm: 2, md: 4, lg: 4, xl: 4 }, children: [
        /* @__PURE__ */ jsx(Grid.Cell, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
          /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodySm", tone: "subdued", children: "Total Products" }),
          /* @__PURE__ */ jsx(Text, { as: "h1", variant: "heading2xl", children: stats.totalProducts }),
          /* @__PURE__ */ jsx(Box$1, { minHeight: "20px", children: stats.totalProducts > 0 && /* @__PURE__ */ jsx(Button, { variant: "plain", size: "slim", onClick: () => navigate("/app/products"), children: "View all" }) })
        ] }) }) }),
        /* @__PURE__ */ jsx(Grid.Cell, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
          /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodySm", tone: "subdued", children: "Total Images" }),
          /* @__PURE__ */ jsx(Text, { as: "h1", variant: "heading2xl", children: stats.totalImages }),
          /* @__PURE__ */ jsx(Box$1, { minHeight: "20px", children: imagesWithoutAlt > 0 ? /* @__PURE__ */ jsxs(Text, { as: "p", variant: "bodySm", tone: "critical", children: [
            imagesWithoutAlt,
            " without alt text"
          ] }) : stats.totalImages > 0 ? /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodySm", tone: "success", children: "All images have alt text" }) : null })
        ] }) }) }),
        /* @__PURE__ */ jsx(Grid.Cell, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
          /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodySm", tone: "subdued", children: "Alt Text Coverage" }),
          /* @__PURE__ */ jsxs(InlineStack, { gap: "200", blockAlign: "center", children: [
            /* @__PURE__ */ jsx(Text, { as: "h1", variant: "heading2xl", children: stats.totalImages > 0 ? `${altTextCoverage}%` : "—" }),
            stats.totalImages > 0 && /* @__PURE__ */ jsx(Badge, { tone: altTextCoverage >= 80 ? "success" : altTextCoverage >= 50 ? "warning" : "critical", children: altTextCoverage >= 80 ? "Good" : altTextCoverage >= 50 ? "Fair" : "Needs work" })
          ] }),
          /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodySm", tone: "subdued", children: stats.totalImages > 0 ? `${stats.imagesWithAlt} of ${stats.totalImages} images have alt text` : "No images synced yet" })
        ] }) }) }),
        /* @__PURE__ */ jsx(Grid.Cell, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
          /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodySm", tone: "subdued", children: "AI Generated" }),
          /* @__PURE__ */ jsx(Text, { as: "h1", variant: "heading2xl", children: stats.imagesWithAi }),
          /* @__PURE__ */ jsx(Box$1, { minHeight: "20px", children: stats.imagesPending > 0 ? /* @__PURE__ */ jsxs(Text, { as: "p", variant: "bodySm", tone: "info", children: [
            stats.imagesPending,
            " pending review"
          ] }) : stats.imagesWithAi > 0 ? /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodySm", tone: "success", children: "All reviewed" }) : /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodySm", tone: "subdued", children: "No generations yet" }) })
        ] }) }) })
      ] }) }),
      /* @__PURE__ */ jsx(Layout.Section, { variant: "oneHalf", children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
        /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", children: [
          /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "AI Generation Usage" }),
          /* @__PURE__ */ jsx(Badge, { children: usage.planName })
        ] }),
        /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
          /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", children: [
            /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "Monthly Usage" }),
            /* @__PURE__ */ jsxs(Badge, { tone: quotaCritical ? "critical" : quotaWarning ? "warning" : "success", children: [
              usage.imagesGenerated,
              " / ",
              usage.quota
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            ProgressBar,
            {
              progress: Math.min(usage.percentage, 100) / 100,
              tone: quotaCritical ? "critical" : quotaWarning ? "warning" : "success"
            }
          ),
          /* @__PURE__ */ jsxs(Text, { as: "p", variant: "bodySm", tone: "subdued", children: [
            usage.quota - usage.imagesGenerated,
            " generations remaining this month"
          ] })
        ] }),
        /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
          /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", children: [
            /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "AI-Generated Alt Texts" }),
            /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", fontWeight: "semibold", children: stats.imagesWithAi })
          ] }),
          /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", children: [
            /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "Pending Review" }),
            /* @__PURE__ */ jsx(Badge, { tone: stats.imagesPending > 0 ? "info" : "success", children: stats.imagesPending > 0 ? `${stats.imagesPending} pending` : "All reviewed" })
          ] }),
          /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", children: [
            /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "Alt Text Coverage" }),
            /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", fontWeight: "semibold", children: stats.totalImages > 0 ? `${altTextCoverage}%` : "—" })
          ] })
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsx(Layout.Section, { variant: "oneHalf", children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
        /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Quick Actions" }),
        /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
          /* @__PURE__ */ jsxs(ButtonGroup, { fullWidth: true, children: [
            /* @__PURE__ */ jsx(Button, { onClick: () => navigate("/app/products"), variant: "primary", children: "Sync & View Products" }),
            /* @__PURE__ */ jsx(Button, { onClick: () => navigate("/app/generate"), children: "Generate Alt Text" })
          ] }),
          /* @__PURE__ */ jsxs(ButtonGroup, { fullWidth: true, children: [
            /* @__PURE__ */ jsxs(Button, { onClick: () => navigate("/app/review"), disabled: !hasAiGenerated, children: [
              "Review Suggestions",
              !hasAiGenerated && " (no suggestions yet)"
            ] }),
            /* @__PURE__ */ jsx(Button, { onClick: () => navigate("/app/backup"), children: "Backup Data" })
          ] })
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "300", children: [
        /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", blockAlign: "center", children: [
          /* @__PURE__ */ jsxs(BlockStack, { gap: "100", children: [
            /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Current Plan" }),
            /* @__PURE__ */ jsxs(Text, { as: "p", variant: "bodySm", tone: "subdued", children: [
              usage.planName,
              " — ",
              usage.quota,
              " image generations per month"
            ] })
          ] }),
          /* @__PURE__ */ jsx(Badge, { tone: "info", children: usage.planName })
        ] }),
        planType === "free" && /* @__PURE__ */ jsx(
          Box$1,
          {
            padding: "300",
            borderRadius: "200",
            background: "bg-surface-secondary",
            children: /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
              /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", fontWeight: "semibold", children: "Upgrade to unlock more generations" }),
              /* @__PURE__ */ jsxs(List, { type: "bullet", children: [
                /* @__PURE__ */ jsxs(List.Item, { children: [
                  /* @__PURE__ */ jsx(Text, { as: "span", fontWeight: "semibold", children: "Starter ($9/mo):" }),
                  " 300 images/month — perfect for small shops"
                ] }),
                /* @__PURE__ */ jsxs(List.Item, { children: [
                  /* @__PURE__ */ jsx(Text, { as: "span", fontWeight: "semibold", children: "Professional ($19/mo):" }),
                  " 1,000 images/month for growing stores"
                ] }),
                /* @__PURE__ */ jsxs(List.Item, { children: [
                  /* @__PURE__ */ jsx(Text, { as: "span", fontWeight: "semibold", children: "Business ($49/mo):" }),
                  " 5,000 images/month for large catalogs"
                ] })
              ] }),
              /* @__PURE__ */ jsx(Button, { variant: "primary", onClick: () => navigate("/app/settings"), children: "Upgrade Plan" })
            ] })
          }
        )
      ] }) }) })
    ] })
  ] });
}
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$3,
  default: DashboardIndex,
  loader: loader$7
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
const loader$6 = async ({ request }) => {
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
  const allWithAi = await prisma.productImage.count({
    where: { altTextAi: { not: null } }
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
  const reviewed = (statusCounts.approved || 0) + (statusCounts.rejected || 0);
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
    statusCounts,
    totalWithAi: allWithAi,
    reviewed
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
  try {
    if (intent === "approve") {
      const imageIds = formData.getAll("imageIds");
      let approved = 0;
      let errors = 0;
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
        } else {
          errors++;
        }
      }
      return json({ success: true, approved, errors, intent: "approve" });
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
      return json({ success: true, rejected: imageIds.length, intent: "reject" });
    }
    if (intent === "edit") {
      const imageId = parseInt(formData.get("imageId"), 10);
      const newAltText = formData.get("altText");
      if (!newAltText || newAltText.trim().length === 0) {
        return json({ success: false, error: "Alt text cannot be empty", intent: "edit" });
      }
      if (newAltText.length > 125) {
        return json({ success: false, error: "Alt text must be 125 characters or less", intent: "edit" });
      }
      const image = await prisma.productImage.findUnique({
        where: { id: imageId }
      });
      if (!image) {
        return json({ success: false, error: "Image not found", intent: "edit" });
      }
      await prisma.productImage.update({
        where: { id: imageId },
        data: { altTextAi: newAltText.trim() }
      });
      const autoApply = formData.get("autoApply") === "true";
      if (autoApply) {
        const success = await updateImageAltText(admin, image.shopifyImageId, newAltText.trim());
        if (success) {
          await prisma.productImage.update({
            where: { id: imageId },
            data: {
              altTextOriginal: newAltText.trim(),
              status: "applied"
            }
          });
        }
      }
      return json({ success: true, intent: "edit" });
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
      let errors = 0;
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
        } else {
          errors++;
        }
      }
      return json({ success: true, approved, errors, intent: "bulk_approve" });
    }
    if (intent === "bulk_reject") {
      const pendingImages = await prisma.productImage.findMany({
        where: {
          product: { shopId: shop.id },
          status: "pending",
          altTextAi: { not: null }
        }
      });
      for (const image of pendingImages) {
        await prisma.productImage.update({
          where: { id: image.id },
          data: { status: "rejected" }
        });
      }
      return json({ success: true, rejected: pendingImages.length, intent: "bulk_reject" });
    }
    return json({ success: false, error: "Unknown action", intent: "unknown" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return json({ success: false, error: message, intent });
  }
};
function StatusBadge({ status }) {
  const config = {
    applied: { tone: "success", label: "Applied" },
    pending: { tone: "info", label: "Pending" },
    rejected: { tone: "critical", label: "Rejected" },
    generated: { tone: "warning", label: "Generated" }
  };
  const c = config[status] || { tone: "info", label: status };
  return /* @__PURE__ */ jsx(Badge, { tone: c.tone, children: c.label });
}
function ReviewPage() {
  const { images, filter, statusCounts, totalWithAi, reviewed } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isProcessing = navigation.state !== "idle";
  const [selectedFilter, setSelectedFilter] = useState(filter);
  const [selectedResources, setSelectedResources] = useState([]);
  const [editingRow, setEditingRow] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [toast, setToast] = useState(null);
  useMemo(() => {
    if (actionData == null ? void 0 : actionData.success) {
      const ad = actionData;
      if (ad.intent === "approve" || ad.intent === "bulk_approve") {
        const msg = ad.errors > 0 ? `Approved ${ad.approved} images (${ad.errors} failed to sync to Shopify)` : `Successfully approved ${ad.approved} images`;
        setToast({ message: msg, tone: ad.errors > 0 ? "warning" : "success" });
      } else if (ad.intent === "reject" || ad.intent === "bulk_reject") {
        setToast({ message: `Rejected ${ad.rejected} images`, tone: "success" });
      } else if (ad.intent === "edit") {
        setToast({ message: "Alt text updated successfully", tone: "success" });
      }
    } else if (actionData && !actionData.success) {
      setToast({ message: actionData.error || "Operation failed", tone: "critical" });
    }
  }, [actionData]);
  const tabs = useMemo(() => [
    { id: "pending", content: `Pending (${statusCounts.pending || 0})` },
    { id: "approved", content: `Applied (${statusCounts.approved || 0})` },
    { id: "rejected", content: `Rejected (${statusCounts.rejected || 0})` },
    { id: "all", content: "All" }
  ], [statusCounts]);
  const selectedTabIndex = tabs.findIndex((t) => t.id === selectedFilter);
  const handleFilterChange = useCallback(
    (selectedTabIndex2) => {
      const newFilter = tabs[selectedTabIndex2].id;
      setSelectedFilter(newFilter);
      setSelectedResources([]);
      const params = new URLSearchParams();
      if (newFilter !== "pending") params.set("filter", newFilter);
      submit(params, { method: "get" });
    },
    [submit, tabs]
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
  const handleBulkReject = useCallback(() => {
    const formData = new FormData();
    formData.set("intent", "bulk_reject");
    submit(formData, { method: "post" });
  }, [submit]);
  const handleStartEdit = useCallback((id, altText) => {
    setEditingRow({ id, altText });
    setEditValue(altText);
  }, []);
  const handleSaveEdit = useCallback(() => {
    if (!editingRow) return;
    if (!editValue.trim()) return;
    if (editValue.length > 125) return;
    const formData = new FormData();
    formData.set("intent", "edit");
    formData.set("imageId", String(editingRow.id));
    formData.set("altText", editValue.trim());
    formData.set("autoApply", "true");
    submit(formData, { method: "post" });
    setEditingRow(null);
  }, [editingRow, editValue, submit]);
  const handleCancelEdit = useCallback(() => {
    setEditingRow(null);
    setEditValue("");
  }, []);
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
  const progressPercent = totalWithAi > 0 ? Math.round(reviewed / totalWithAi * 100) : 0;
  const pendingCount = statusCounts.pending || 0;
  const isEditingRow = editingRow !== null;
  return /* @__PURE__ */ jsx(
    Page,
    {
      title: "Review & Approve",
      subtitle: "Review AI-generated alt text before applying to your store",
      children: /* @__PURE__ */ jsxs(Layout, { children: [
        toast && /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(
          Banner,
          {
            title: toast.message,
            tone: toast.tone,
            onDismiss: () => setToast(null)
          }
        ) }),
        /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
          /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", blockAlign: "center", children: [
            /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Review Progress" }),
            /* @__PURE__ */ jsxs(Text, { as: "p", variant: "bodySm", tone: "subdued", children: [
              reviewed,
              " of ",
              totalWithAi,
              " reviewed"
            ] })
          ] }),
          /* @__PURE__ */ jsx(ProgressBar, { progress: progressPercent, tone: progressPercent === 100 ? "success" : "info" })
        ] }) }) }),
        /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
          /* @__PURE__ */ jsx(Tabs, { tabs, selected: selectedTabIndex, onSelect: handleFilterChange }),
          /* @__PURE__ */ jsx(InlineStack, { align: "space-between", blockAlign: "center", children: /* @__PURE__ */ jsxs(InlineStack, { gap: "200", children: [
            selectedResources.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs(Text, { as: "p", variant: "bodySm", fontWeight: "semibold", children: [
                selectedResources.length,
                " selected"
              ] }),
              /* @__PURE__ */ jsxs(ButtonGroup, { children: [
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    onClick: () => handleApprove(selectedResources),
                    disabled: isProcessing,
                    variant: "primary",
                    size: "slim",
                    children: "Approve"
                  }
                ),
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    onClick: () => handleReject(selectedResources),
                    disabled: isProcessing,
                    tone: "critical",
                    size: "slim",
                    children: "Reject"
                  }
                )
              ] })
            ] }),
            pendingCount > 0 && selectedResources.length === 0 && /* @__PURE__ */ jsxs(ButtonGroup, { children: [
              /* @__PURE__ */ jsx(Tooltip, { content: "Approve all pending images and apply to Shopify store", children: /* @__PURE__ */ jsxs(
                Button,
                {
                  onClick: handleBulkApprove,
                  disabled: isProcessing,
                  variant: "primary",
                  size: "slim",
                  children: [
                    "Approve All (",
                    pendingCount,
                    ")"
                  ]
                }
              ) }),
              /* @__PURE__ */ jsx(Tooltip, { content: "Reject all pending images", children: /* @__PURE__ */ jsx(
                Button,
                {
                  onClick: handleBulkReject,
                  disabled: isProcessing,
                  tone: "critical",
                  size: "slim",
                  children: "Reject All"
                }
              ) })
            ] })
          ] }) }),
          images.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { heading: "No images to review", children: /* @__PURE__ */ jsx(Text, { as: "p", children: filter === "pending" ? "All images have been reviewed! Generate more alt text or change the filter." : "No images match the selected filter." }) }) : /* @__PURE__ */ jsx(
            IndexTable,
            {
              resourceName: { singular: "image", plural: "images" },
              itemCount: images.length,
              selectedItemsCount: selectedResources.length,
              onSelectionChange: (selectionType) => {
                if (selectionType === "all") {
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
              hasZebraStriping: true,
              children: images.map((image, index) => {
                const isEditingThis = (editingRow == null ? void 0 : editingRow.id) === image.id;
                return /* @__PURE__ */ jsxs(
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
                      /* @__PURE__ */ jsx(IndexTable.Cell, { children: /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", fontWeight: "semibold", truncate: true, children: image.productTitle }) }),
                      /* @__PURE__ */ jsx(IndexTable.Cell, { children: image.altTextOriginal ? /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodySm", children: image.altTextOriginal.length > 80 ? image.altTextOriginal.slice(0, 80) + "..." : image.altTextOriginal }) : /* @__PURE__ */ jsx(Text, { as: "span", variant: "bodySm", tone: "subdued", children: "No alt text" }) }),
                      /* @__PURE__ */ jsx(IndexTable.Cell, { children: isEditingThis ? /* @__PURE__ */ jsxs(BlockStack, { gap: "100", children: [
                        /* @__PURE__ */ jsx(
                          TextField,
                          {
                            label: "",
                            labelHidden: true,
                            value: editValue,
                            onChange: setEditValue,
                            maxLength: 125,
                            showCharacterCount: true,
                            autoComplete: "off",
                            autoFocus: true
                          }
                        ),
                        /* @__PURE__ */ jsxs(InlineStack, { gap: "100", children: [
                          /* @__PURE__ */ jsx(Button, { size: "slim", variant: "primary", onClick: handleSaveEdit, disabled: !editValue.trim(), children: "Save" }),
                          /* @__PURE__ */ jsx(Button, { size: "slim", onClick: handleCancelEdit, children: "Cancel" })
                        ] })
                      ] }) : /* @__PURE__ */ jsx(
                        Box$1,
                        {
                          padding: "100",
                          background: "bg-surface-secondary",
                          borderRadius: "200",
                          minHeight: "32px",
                          onClick: () => handleStartEdit(image.id, image.altTextAi || ""),
                          style: { cursor: "pointer" },
                          children: /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodySm", children: image.altTextAi ? image.altTextAi.length > 80 ? image.altTextAi.slice(0, 80) + "..." : image.altTextAi : /* @__PURE__ */ jsx(Text, { as: "span", tone: "subdued", children: "Not generated" }) })
                        }
                      ) }),
                      /* @__PURE__ */ jsx(IndexTable.Cell, { children: /* @__PURE__ */ jsx(StatusBadge, { status: image.status }) }),
                      /* @__PURE__ */ jsx(IndexTable.Cell, { children: /* @__PURE__ */ jsxs(ButtonGroup, { children: [
                        /* @__PURE__ */ jsx(
                          Button,
                          {
                            size: "slim",
                            variant: "plain",
                            onClick: () => handleApprove([String(image.id)]),
                            disabled: image.status === "applied" || isProcessing || isEditingRow,
                            children: "Approve"
                          }
                        ),
                        /* @__PURE__ */ jsx(
                          Button,
                          {
                            size: "slim",
                            variant: "plain",
                            onClick: () => handleStartEdit(image.id, image.altTextAi || ""),
                            disabled: isEditingRow,
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
                            disabled: image.status === "rejected" || isProcessing || isEditingRow,
                            children: "Reject"
                          }
                        )
                      ] }) })
                    ]
                  },
                  image.id
                );
              })
            }
          )
        ] }) }) })
      ] })
    }
  );
}
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$1,
  default: ReviewPage,
  loader: loader$5
}, Symbol.toStringTag, { value: "Module" }));
async function action({ request }) {
  try {
    const topic = request.headers.get("x-shopify-topic") || "unknown";
    const shopDomain = request.headers.get("x-shopify-shop-domain") || "";
    const hmac = request.headers.get("x-shopify-hmac-sha256") || "";
    if (!hmac) {
      console.warn(`[Webhook] Missing HMAC for topic: ${topic}`);
      return json$1({ error: "Missing HMAC" }, { status: 401 });
    }
    const body = await request.text();
    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      payload = { raw: body };
    }
    console.log(`[Webhook] Received: topic=${topic}, shop=${shopDomain}`);
    switch (topic) {
      case "app/uninstalled":
      case "APP_UNINSTALLED": {
        await handleAppUninstalled(shopDomain);
        break;
      }
      case "shop/redact":
      case "SHOP_REDACT": {
        await handleShopRedact(shopDomain, payload);
        break;
      }
      case "customers/data_request":
      case "CUSTOMERS_DATA_REQUEST": {
        await handleCustomersDataRequest(shopDomain, payload);
        break;
      }
      case "app_subscriptions/update":
      case "APP_SUBSCRIPTIONS_UPDATE": {
        await handleSubscriptionUpdate(payload);
        break;
      }
      case "app_subscriptions/decline":
      case "APP_SUBSCRIPTIONS_DECLINE": {
        await handleSubscriptionDecline(shopDomain);
        break;
      }
      default: {
        console.log(`[Webhook] Unknown topic: ${topic}`);
        return json$1({ message: "Unknown topic" }, { status: 404 });
      }
    }
    return json$1({ ok: true }, { status: 200 });
  } catch (error) {
    console.error(`[Webhook] Error processing webhook:`, error);
    return json$1({ ok: true, error: "Internal error" }, { status: 200 });
  }
}
async function handleAppUninstalled(shopDomain) {
  const now = /* @__PURE__ */ new Date();
  const retentionDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1e3);
  const shop = await prisma.shop.findUnique({ where: { shopDomain } });
  if (!shop) {
    console.warn(`[Webhook] Shop not found for uninstall: ${shopDomain}`);
    return;
  }
  await prisma.shop.update({
    where: { shopDomain },
    data: {
      status: "uninstalled",
      accessToken: "",
      uninstallDate: now,
      dataRetentionUntil: retentionDate
    }
  });
  await prisma.session.deleteMany({
    where: { shop: shopDomain }
  });
  console.log(
    `[Webhook] Shop ${shopDomain} uninstalled. Data retained until ${retentionDate.toISOString()}`
  );
}
async function handleShopRedact(shopDomain, payload) {
  const shop = await prisma.shop.findUnique({ where: { shopDomain } });
  if (!shop) {
    console.warn(`[Webhook] Shop not found for redact: ${shopDomain}`);
    return;
  }
  console.log(`[Webhook] Redacting all data for shop ${shopDomain} (ID: ${shop.id})`);
  await deleteShopData(shop.id);
  console.log(`[Webhook] Data redacted for shop ${shopDomain}`);
}
async function handleCustomersDataRequest(shopDomain, payload) {
  console.log(
    `[Webhook] Customer data request for shop ${shopDomain}:`,
    JSON.stringify({ shopDomain, customerId: payload.customer_id || "unknown" })
  );
}
async function handleSubscriptionUpdate(payload) {
  var _a, _b, _c, _d, _e;
  const shopDomain = payload.shop_domain || ((_a = payload.shop) == null ? void 0 : _a.domain) || "";
  const planName = ((_b = payload.app_subscription) == null ? void 0 : _b.name) || "";
  const status = ((_c = payload.app_subscription) == null ? void 0 : _c.status) || "";
  const chargeId = ((_e = (_d = payload.app_subscription) == null ? void 0 : _d.id) == null ? void 0 : _e.toString()) || "";
  if (!shopDomain) {
    console.warn(`[Webhook] Subscription update missing shop domain`);
    return;
  }
  const shop = await prisma.shop.findUnique({ where: { shopDomain } });
  if (!shop) {
    console.warn(`[Webhook] Shop not found for subscription update: ${shopDomain}`);
    return;
  }
  const planMap = {
    "Free": "free",
    "Starter": "starter",
    "Professional": "professional",
    "Business": "business"
  };
  const planType = planMap[planName] || "free";
  if (status === "ACTIVE" || status === "active") {
    await prisma.shop.update({
      where: { shopDomain },
      data: { planType, chargeId }
    });
    console.log(
      `[Webhook] Subscription updated for ${shopDomain}: ${planName} (${planType}), charge: ${chargeId}`
    );
  } else if (status === "CANCELLED" || status === "cancelled" || status === "FROZEN") {
    await prisma.shop.update({
      where: { shopDomain },
      data: { planType: "free", chargeId: null }
    });
    console.log(
      `[Webhook] Subscription cancelled/frozen for ${shopDomain}, reverting to Free`
    );
  }
}
async function handleSubscriptionDecline(shopDomain) {
  if (!shopDomain) return;
  await prisma.shop.update({
    where: { shopDomain },
    data: { planType: "free", chargeId: null }
  });
  console.log(`[Webhook] Subscription declined for ${shopDomain}, reverted to Free`);
}
async function loader$4() {
  return json$1({ error: "Method not allowed" }, { status: 405 });
}
const route7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action,
  loader: loader$4
}, Symbol.toStringTag, { value: "Module" }));
const loader$3 = async () => {
  return json$1({ lastUpdated: "2024-01-01" });
};
function PrivacyPage() {
  const { lastUpdated } = useLoaderData();
  return /* @__PURE__ */ jsx(Page, { title: "Privacy Policy", subtitle: `Last updated: ${lastUpdated}`, children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
    /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Privacy Policy for AltOptimizer" }),
    /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingSm", children: "1. What Data We Collect" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "AltOptimizer collects and processes the following data from your Shopify store:" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "• Product data: titles, descriptions, handles, SKUs, and prices" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "• Product images: for AI analysis and alt text generation" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "• Generated content: AI-generated alt text, product tags, and JSON-LD structured data" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "• Usage metrics: number of images processed per month for quota tracking" }),
    /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingSm", children: "2. What We Do NOT Collect" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "AltOptimizer does NOT collect:" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "• Customer data (names, emails, addresses, payment information)" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "• Order information or transaction data" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "• Personal identifiable information of store visitors" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "• Analytics or browsing behavior of store visitors" }),
    /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingSm", children: "3. How We Use Your Data" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "• Product images are sent to OpenAI's GPT-4o API for AI analysis to generate descriptive alt text" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "• Product titles and descriptions are used to generate relevant tags and structured data" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "• Usage data is tracked for billing and quota management" }),
    /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingSm", children: "4. Data Storage and Retention" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "• Your data is stored securely in our database during your active subscription" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "• After uninstalling the app, your data is retained for 30 days (grace period)" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "• After 30 days, all data is permanently deleted" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "• You can request immediate data deletion at any time from the Settings page" }),
    /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingSm", children: "5. Data Sharing" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "• Product images are sent to OpenAI's API for AI analysis. OpenAI does not use your data for training." }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "• We do not sell, trade, or share your data with any third parties" }),
    /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingSm", children: "6. Contact" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "For privacy-related inquiries, please contact the app developer through the Shopify App Store." })
  ] }) }) });
}
const route8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: PrivacyPage,
  loader: loader$3
}, Symbol.toStringTag, { value: "Module" }));
const loader$2 = async ({ request }) => {
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
const route9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$2
}, Symbol.toStringTag, { value: "Module" }));
const loader$1 = async () => {
  return json$1({ lastUpdated: "2024-01-01" });
};
function TermsPage() {
  const { lastUpdated } = useLoaderData();
  return /* @__PURE__ */ jsx(Page, { title: "Terms of Service", subtitle: `Last updated: ${lastUpdated}`, children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
    /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Terms of Service for AltOptimizer" }),
    /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingSm", children: "1. Acceptance of Terms" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: 'By installing and using AltOptimizer (the "App"), you agree to these Terms of Service. If you do not agree, do not install or use the App.' }),
    /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingSm", children: "2. Description of Service" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "AltOptimizer is an AI-powered tool that generates SEO-optimized alt text, product tags, and JSON-LD structured data for Shopify product images. The App uses OpenAI's GPT-4o API to analyze product images and generate descriptive content." }),
    /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingSm", children: "3. Subscription and Billing" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "• The App offers multiple subscription plans as described on the pricing page" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "• All plans are billed through Shopify's billing system on a recurring 30-day basis" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "• You can upgrade, downgrade, or cancel your subscription at any time" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "• Downgrading takes effect at the next billing cycle" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "• No refunds are provided for partial billing periods" }),
    /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingSm", children: "4. Usage Limits" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "• Each plan has a monthly quota of image generations as specified on the pricing page" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "• Usage resets at the start of each billing cycle" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "• Exceeding your quota will prevent further generations until the next cycle or plan upgrade" }),
    /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingSm", children: "5. Acceptable Use" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "You agree to use the App only for lawful purposes and in accordance with Shopify's Terms of Service. You may not:" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "• Use the App to generate content that violates any applicable laws" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "• Attempt to circumvent quota limits or billing systems" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "• Reverse engineer or modify the App's code" }),
    /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingSm", children: "6. Limitation of Liability" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: 'The App is provided "as is" without warranty of any kind. The developer shall not be liable for any damages arising from the use or inability to use the App, including but not limited to:' }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "• Loss of data (backup your data regularly using the backup feature)" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "• AI-generated content accuracy (always review before applying)" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "• Service interruptions or downtime" }),
    /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingSm", children: "7. Data Handling" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "• Product images are sent to OpenAI for AI analysis. See our Privacy Policy for details." }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "• We implement reasonable security measures to protect your data" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "• You can delete your data at any time from the Settings page" }),
    /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingSm", children: "8. Changes to Terms" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "We reserve the right to modify these terms at any time. You will be notified of material changes via the App or email." }),
    /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingSm", children: "9. Contact" }),
    /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodyMd", children: "For questions about these terms, please contact the app developer through the Shopify App Store." })
  ] }) }) });
}
const route10 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: TermsPage,
  loader: loader$1
}, Symbol.toStringTag, { value: "Module" }));
function Boundary({ error: errorProp }) {
  const routeError = useRouteError();
  const error = errorProp || routeError;
  let title = "Something went wrong";
  let description = "An unexpected error occurred. Please try again.";
  let showRetry = true;
  if (isRouteErrorResponse(error)) {
    title = `Error ${error.status}`;
    switch (error.status) {
      case 404:
        description = "The page you're looking for doesn't exist or has been removed.";
        break;
      case 403:
        description = "You don't have permission to access this page. Please contact your Shopify admin.";
        showRetry = false;
        break;
      case 401:
        description = "Your session has expired. Please refresh the page to re-authenticate.";
        break;
      case 429:
        description = "Too many requests. Please wait a moment and try again.";
        break;
      case 500:
        description = "The server encountered an internal error. Our team has been notified.";
        break;
      default:
        description = error.statusText || description;
    }
  } else if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("quota") || msg.includes("rate limit") || msg.includes("429") || msg.includes("too many")) {
      title = "Rate Limit Reached";
      description = "The AI service is temporarily rate-limited. Please wait a moment and try again.";
    } else if (msg.includes("timeout") || msg.includes("timed out") || msg.includes("abort")) {
      title = "Request Timed Out";
      description = "The request took too long to complete. The AI service may be experiencing high load. Please try again.";
    } else if (msg.includes("openai") || msg.includes("api key") || msg.includes("auth")) {
      title = "AI Service Configuration Error";
      description = "There's an issue with the AI service configuration. Please check your API key in Settings.";
      showRetry = false;
    } else if (msg.includes("invalid image") || msg.includes("image format") || msg.includes("base64")) {
      title = "Invalid Image";
      description = "The image could not be processed. It may be corrupted or in an unsupported format.";
    } else if (msg.includes("network") || msg.includes("fetch") || msg.includes("econnrefused")) {
      title = "Network Error";
      description = "Unable to connect to the server. Please check your internet connection and try again.";
    } else if (msg.includes("not found") || msg.includes("missing")) {
      title = "Data Not Found";
      description = "The requested data could not be found. It may have been deleted or not yet synced.";
    } else {
      description = error.message;
    }
  }
  return /* @__PURE__ */ jsx(Page, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(
    EmptyState,
    {
      heading: title,
      action: showRetry ? {
        content: "Try Again",
        onAction: () => window.location.reload()
      } : void 0,
      secondaryAction: {
        content: "Go to Dashboard",
        onAction: () => {
          window.location.href = "/app";
        }
      },
      children: /* @__PURE__ */ jsx(Text, { as: "p", children: description })
    }
  ) }) });
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
    Box$1,
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
  return /* @__PURE__ */ jsxs(Box$1, { minHeight: "100vh", display: "flex", flexDirection: "column", children: [
    /* @__PURE__ */ jsx(AppNav, {}),
    /* @__PURE__ */ jsx(Box$1, { flex: 1, children: /* @__PURE__ */ jsx(Outlet, {}) }),
    /* @__PURE__ */ jsx(
      Box$1,
      {
        padding: "300",
        borderBlockStart: "025",
        background: "bg-surface-secondary",
        children: /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", blockAlign: "center", wrap: false, children: [
          /* @__PURE__ */ jsxs(InlineStack, { gap: "400", wrap: false, children: [
            /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodySm", tone: "subdued", children: "AltOptimizer v1.0.0" }),
            /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodySm", tone: "subdued", children: /* @__PURE__ */ jsx(Link, { to: "/privacy", style: { textDecoration: "none" }, children: "Privacy Policy" }) }),
            /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodySm", tone: "subdued", children: /* @__PURE__ */ jsx(Link, { to: "/terms", style: { textDecoration: "none" }, children: "Terms of Service" }) })
          ] }),
          /* @__PURE__ */ jsx(Text, { as: "p", variant: "bodySm", tone: "subdued", children: "Support: support@altoptimizer.com" })
        ] })
      }
    )
  ] });
}
function ErrorBoundary() {
  const error = useRouteError();
  return /* @__PURE__ */ jsx(Boundary, { error });
}
const headers = (headersParams) => {
  const shopify = getShopifySafe();
  if (shopify) {
    return shopify.addDocumentResponseHeaders(headersParams);
  }
  return new Headers();
};
const route11 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  default: AppLayout,
  headers,
  loader
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-iT-EbqKB.js", "imports": ["/assets/components-DP6mLf4j.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": true, "module": "/assets/root-Bf7x-mWx.js", "imports": ["/assets/components-DP6mLf4j.js", "/assets/Page-CAtI6ImP.js", "/assets/context-B8MdE6Ma.js", "/assets/EmptyState-Duni_2QU.js", "/assets/Image-C-11cqQS.js"], "css": [] }, "routes/app.generate": { "id": "routes/app.generate", "parentId": "routes/app", "path": "generate", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.generate-DsIsshWI.js", "imports": ["/assets/components-DP6mLf4j.js", "/assets/constants-Bsaf0VJ5.js", "/assets/use-index-resource-state-CKjPN4oT.js", "/assets/Page-CAtI6ImP.js", "/assets/Modal-Drxzqmf6.js", "/assets/Banner-BHD7uOIW.js", "/assets/Layout-D_Jv5gGd.js", "/assets/FormLayout-nWS6wmRf.js", "/assets/Select-iXOOhk-e.js", "/assets/Thumbnail-vc0EQUdg.js", "/assets/List-BZsb-uP5.js", "/assets/context-B8MdE6Ma.js", "/assets/CSSTransition-DWW8YkE0.js", "/assets/Image-C-11cqQS.js", "/assets/Sticky-JXQRhMnx.js"], "css": [] }, "routes/app.products": { "id": "routes/app.products", "parentId": "routes/app", "path": "products", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.products-DSRJMxPg.js", "imports": ["/assets/components-DP6mLf4j.js", "/assets/use-index-resource-state-CKjPN4oT.js", "/assets/Page-CAtI6ImP.js", "/assets/Thumbnail-vc0EQUdg.js", "/assets/Modal-Drxzqmf6.js", "/assets/Image-C-11cqQS.js", "/assets/Layout-D_Jv5gGd.js", "/assets/index-CAaWPS8X.js", "/assets/CSSTransition-DWW8YkE0.js", "/assets/Select-iXOOhk-e.js", "/assets/EmptyState-Duni_2QU.js", "/assets/Sticky-JXQRhMnx.js", "/assets/context-B8MdE6Ma.js"], "css": [] }, "routes/app.settings": { "id": "routes/app.settings", "parentId": "routes/app", "path": "settings", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.settings-Be7SJc98.js", "imports": ["/assets/components-DP6mLf4j.js", "/assets/constants-Bsaf0VJ5.js", "/assets/Page-CAtI6ImP.js", "/assets/Layout-D_Jv5gGd.js", "/assets/Banner-BHD7uOIW.js", "/assets/DataTable-uRktxyMF.js", "/assets/FormLayout-nWS6wmRf.js", "/assets/Select-iXOOhk-e.js", "/assets/ProgressBar-DOj1Xpf8.js", "/assets/index-CAaWPS8X.js", "/assets/Sticky-JXQRhMnx.js", "/assets/CSSTransition-DWW8YkE0.js"], "css": [] }, "routes/app._index": { "id": "routes/app._index", "parentId": "routes/app", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app._index-Dtp_Xgbw.js", "imports": ["/assets/components-DP6mLf4j.js", "/assets/Modal-Drxzqmf6.js", "/assets/Page-CAtI6ImP.js", "/assets/List-BZsb-uP5.js", "/assets/Layout-D_Jv5gGd.js", "/assets/Banner-BHD7uOIW.js", "/assets/ProgressBar-DOj1Xpf8.js", "/assets/context-B8MdE6Ma.js", "/assets/CSSTransition-DWW8YkE0.js"], "css": [] }, "routes/app.backup": { "id": "routes/app.backup", "parentId": "routes/app", "path": "backup", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.backup-CGmCxJJj.js", "imports": ["/assets/components-DP6mLf4j.js", "/assets/Page-CAtI6ImP.js", "/assets/Layout-D_Jv5gGd.js", "/assets/Banner-BHD7uOIW.js", "/assets/EmptyState-Duni_2QU.js", "/assets/DataTable-uRktxyMF.js", "/assets/Image-C-11cqQS.js", "/assets/index-CAaWPS8X.js", "/assets/Sticky-JXQRhMnx.js"], "css": [] }, "routes/app.review": { "id": "routes/app.review", "parentId": "routes/app", "path": "review", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.review-vfkbqZf9.js", "imports": ["/assets/components-DP6mLf4j.js", "/assets/Page-CAtI6ImP.js", "/assets/Layout-D_Jv5gGd.js", "/assets/Banner-BHD7uOIW.js", "/assets/ProgressBar-DOj1Xpf8.js", "/assets/Modal-Drxzqmf6.js", "/assets/FormLayout-nWS6wmRf.js", "/assets/EmptyState-Duni_2QU.js", "/assets/Thumbnail-vc0EQUdg.js", "/assets/CSSTransition-DWW8YkE0.js", "/assets/context-B8MdE6Ma.js", "/assets/Image-C-11cqQS.js", "/assets/Sticky-JXQRhMnx.js"], "css": [] }, "routes/webhooks": { "id": "routes/webhooks", "parentId": "root", "path": "webhooks", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/webhooks-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/privacy": { "id": "routes/privacy", "parentId": "root", "path": "privacy", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/privacy-BqQSm1hK.js", "imports": ["/assets/components-DP6mLf4j.js", "/assets/Page-CAtI6ImP.js"], "css": [] }, "routes/auth.$": { "id": "routes/auth.$", "parentId": "root", "path": "auth/*", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/auth._-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/terms": { "id": "routes/terms", "parentId": "root", "path": "terms", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/terms-CKEQRibZ.js", "imports": ["/assets/components-DP6mLf4j.js", "/assets/Page-CAtI6ImP.js"], "css": [] }, "routes/app": { "id": "routes/app", "parentId": "root", "path": "app", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": true, "module": "/assets/app-UBN2G5JV.js", "imports": ["/assets/components-DP6mLf4j.js", "/assets/Page-CAtI6ImP.js", "/assets/EmptyState-Duni_2QU.js", "/assets/Image-C-11cqQS.js"], "css": [] } }, "url": "/assets/manifest-0eabd6d3.js", "version": "0eabd6d3" };
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
  "routes/privacy": {
    id: "routes/privacy",
    parentId: "root",
    path: "privacy",
    index: void 0,
    caseSensitive: void 0,
    module: route8
  },
  "routes/auth.$": {
    id: "routes/auth.$",
    parentId: "root",
    path: "auth/*",
    index: void 0,
    caseSensitive: void 0,
    module: route9
  },
  "routes/terms": {
    id: "routes/terms",
    parentId: "root",
    path: "terms",
    index: void 0,
    caseSensitive: void 0,
    module: route10
  },
  "routes/app": {
    id: "routes/app",
    parentId: "root",
    path: "app",
    index: void 0,
    caseSensitive: void 0,
    module: route11
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
