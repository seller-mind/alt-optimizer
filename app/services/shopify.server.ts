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
    images: edge.node.images.edges.map((img: any) => ({
      id: img.node.id,
      src: img.node.url,
      altText: img.node.altText,
      width: img.node.width,
      height: img.node.height,
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
  imageId: string,
  altText: string
): Promise<boolean> {
  const response = await admin.graphql(
    `mutation UpdateMediaAlt($media: [MediaUpdateInput!]!) {
      productUpdateMedia(media: $media) {
        media { id alt }
        mediaUserErrors { field message }
      }
    }`,
    {
      variables: {
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
