import type { Session } from "@shopify/shopify-api";

interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  vendor: string;
  productType: string;
  tags: string[];
  images: ShopifyImage[];
  variants: ShopifyVariant[];
  status: string;
}

interface ShopifyImage {
  id: string;
  src: string;
  altText: string | null;
  width?: number;
  height?: number;
}

interface ShopifyVariant {
  id: string;
  title: string;
  price: string;
  sku: string | null;
  compareAtPrice: string | null;
}

interface ProductListResult {
  products: ShopifyProduct[];
  cursor: string | null;
}

export async function fetchProducts(
  admin: any,
  cursor: string | null = null
): Promise<ProductListResult> {
  const response = await admin.graphql(
    `query FetchProducts($first: Int!, $after: String) {
      products(first: $first, after: $after) {
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
            media(first: 50) {
              nodes {
                ... on MediaImage {
                  id
                  alt
                  image {
                    url
                    width
                    height
                  }
                }
                mediaContentType
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
    }`,
    {
      variables: {
        first: 50,
        after: cursor,
      },
    }
  );

  const data = await response.json();
  const products = data.data.products.edges.map((edge: any) => ({
    id: edge.node.id,
    title: edge.node.title,
    handle: edge.node.handle,
    description: edge.node.description || "",
    vendor: edge.node.vendor || "",
    productType: edge.node.productType || "",
    tags: edge.node.tags || [],
    status: edge.node.status,
    images: edge.node.media.nodes
      .filter((node: any) => node.mediaContentType === "IMAGE" && node.image)
      .map((node: any) => ({
        id: node.id,
        src: node.image.url,
        altText: node.alt ? node.alt : null,
        width: node.image.width,
        height: node.image.height,
      })),
    variants: edge.node.variants.edges.map((v: any) => ({
      id: v.node.id,
      title: v.node.title,
      price: v.node.price,
      sku: v.node.sku,
      compareAtPrice: v.node.compareAtPrice,
    })),
  }));

  return {
    products,
    cursor: data.data.products.pageInfo.hasNextPage
      ? data.data.products.pageInfo.endCursor
      : null,
  };
}

export async function updateImageAltText(
  admin: any,
  productId: string,
  imageId: string,
  altText: string
): Promise<boolean> {
  const response = await admin.graphql(
    `mutation UpdateMediaAlt($productId: ID!, $media: [UpdateMediaInput!]!) {
      productUpdateMedia(productId: $productId, media: $media) {
        media { id alt }
        mediaUserErrors { field message }
      }
    }`,
    {
      variables: {
        productId,
        media: [{ id: imageId, alt: altText }],
      },
    }
  );

  const data = await response.json();
  const errors = data.data?.productUpdateMedia?.mediaUserErrors;
  return !errors || errors.length === 0;
}

export async function updateProductTags(
  admin: any,
  productId: string,
  tags: string[]
): Promise<boolean> {
  const tagsString = tags.map((t) => `"${t.replace(/"/g, '\\"')}"`).join(", ");

  const response = await admin.graphql(`
    mutation {
      productUpdate(input: {
        id: "${productId}",
        tags: [${tagsString}]
      }) {
        product {
          id
          tags
        }
        userErrors {
          field
          message
        }
      }
    }
  `);

  const data = await response.json();
  const errors = data.data?.productUpdate?.userErrors;
  return !errors || errors.length === 0;
}

export async function fetchImageAsBase64(imageUrl: string): Promise<{ base64: string; mimeType: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(imageUrl, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    const contentType = response.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) {
      throw new Error(`Invalid content type: ${contentType}`);
    }
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > 20 * 1024 * 1024) {
      throw new Error("Image too large (max 20MB)");
    }
    const base64 = Buffer.from(buffer).toString("base64");
    return { base64, mimeType: contentType };
  } finally {
    clearTimeout(timeout);
  }
}

export async function getProductCount(admin: any): Promise<number> {
  const response = await admin.graphql(`
    {
      productsCount {
        count
      }
    }
  `);
  const data = await response.json();
  return data.data?.productsCount?.count || 0;
}

/**
 * Write JSON-LD structured data to a product metafield.
 * The metafield is then readable by the Theme App Extension block.
 */
export async function writeProductJsonLd(
  admin: any,
  productId: string,
  jsonLdString: string
): Promise<boolean> {
  const response = await admin.graphql(
    `mutation SetProductMetafield($productId: ID!, $jsonLd: String!) {
      productUpdate(input: {
        id: $productId,
        metafields: [
          {
            namespace: "altoptimizer",
            key: "jsonld",
            value: $jsonLd,
            type: "json"
          }
        ]
      }) {
        product { id }
        userErrors { field message }
      }
    }`,
    {
      variables: {
        productId,
        jsonLd: jsonLdString,
      },
    }
  );

  const data = await response.json();
  const errors = data.data?.productUpdate?.userErrors;

  // If metafield definition doesn't exist yet, create it first
  if (errors && errors.length > 0 && errors.some((e: any) => e.message?.includes("definition"))) {
    await createJsonLdMetafieldDefinition(admin);
    // Retry
    const retryResponse = await admin.graphql(
      `mutation SetProductMetafield($productId: ID!, $jsonLd: String!) {
        productUpdate(input: {
          id: $productId,
          metafields: [
            {
              namespace: "altoptimizer",
              key: "jsonld",
              value: $jsonLd,
              type: "json"
            }
          ]
        }) {
          product { id }
          userErrors { field message }
        }
      }`,
      { variables: { productId, jsonLd: jsonLdString } }
    );
    const retryData = await retryResponse.json();
    const retryErrors = retryData.data?.productUpdate?.userErrors;
    return !retryErrors || retryErrors.length === 0;
  }

  return !errors || errors.length === 0;
}

/**
 * Create the metafield definition for altoptimizer.jsonld on Product.
 */
async function createJsonLdMetafieldDefinition(admin: any): Promise<void> {
  await admin.graphql(
    `mutation CreateMetafieldDefinition {
      metafieldDefinitionCreate(ownerType: PRODUCT, definition: {
        name: "AltOptimizer JSON-LD",
        namespace: "altoptimizer",
        key: "jsonld",
        type: "json",
        description: "JSON-LD structured data for SEO",
        ownerType: PRODUCT,
        pin: false
      }) {
        createdDefinition { id }
        userErrors { field message }
      }
    }`
  );
}
