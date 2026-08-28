// Standalone sync script - syncs products from Shopify to Neon DB
// Usage: npx tsx sync_test.ts

const DATABASE_URL = "postgresql://neondb_owner:npg_CvTm34pbMXrA@ep-odd-butterfly-axac1xp4-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require&pgbouncer=true";
const SHOPIFY_DOMAIN = "haimo-dev.myshopify.com";
const SHOPIFY_ACCESS_TOKEN = "shpua_b7beb37d771b4facf895253f7b9a1153";

async function graphql(query: string, variables?: any) {
  const res = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2025-01/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GraphQL ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

async function main() {
  // Fetch all products from Shopify
  const data = await graphql(`
    {
      products(first: 50) {
        edges {
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
          }
        }
      }
    }
  `);

  const products = data.products.edges.map((e: any) => e.node);
  console.log(`Found ${products.length} products in Shopify:`);
  products.forEach((p: any) => {
    console.log(`  - ${p.title} (${p.handle}), ${p.images.edges.length} images`);
    p.images.edges.forEach((img: any) => {
      console.log(`    image ${img.node.id}: alt="${img.node.altText}"`);
    });
  });

  // Connect to DB
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    // Get shop ID
    const shopRes = await pool.query("SELECT id FROM shops WHERE shop_domain = $1", [SHOPIFY_DOMAIN]);
    if (shopRes.rows.length === 0) throw new Error("Shop not found in DB");
    const shopId = shopRes.rows[0].id;
    console.log(`\nShop ID: ${shopId}`);

    // Upsert products
    for (const p of products) {
      const shopifyId = parseInt(p.id.split("/").pop(), 10);

      // Check if product exists
      const existing = await pool.query("SELECT id FROM products WHERE shop_id = $1 AND shopify_product_id = $2", [shopId, shopifyId]);

      let productId: number;
      if (existing.rows.length > 0) {
        productId = existing.rows[0].id;
        await pool.query(
          "UPDATE products SET title = $1, handle = $2, description = $3, image_count = $4 WHERE id = $5",
          [p.title, p.handle, p.description || "", p.images.edges.length, productId]
        );
        console.log(`Updated product: ${p.title} (id=${productId})`);
      } else {
        const insert = await pool.query(
          "INSERT INTO products (shop_id, shopify_product_id, title, handle, description, image_count) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id",
          [shopId, shopifyId, p.title, p.handle, p.description || "", p.images.edges.length]
        );
        productId = insert.rows[0].id;
        console.log(`Created product: ${p.title} (id=${productId})`);
      }

      // Upsert images
      for (const imgEdge of p.images.edges) {
        const img = imgEdge.node;
        const shopifyImageId = parseInt(img.id.split("/").pop(), 10);

        const existingImg = await pool.query(
          "SELECT id FROM product_images WHERE product_id = $1 AND shopify_image_id = $2",
          [productId, shopifyImageId]
        );

        if (existingImg.rows.length > 0) {
          await pool.query(
            "UPDATE product_images SET src = $1, alt_text_original = $2, tags_original = $3 WHERE id = $4",
            [img.url, img.altText, (p.tags || []).join(", "), existingImg.rows[0].id]
          );
          console.log(`  Updated image: ${img.url.split("/").pop()} alt="${img.altText}"`);
        } else {
          const status = img.altText ? "approved" : "pending";
          await pool.query(
            "INSERT INTO product_images (product_id, shopify_image_id, src, alt_text_original, tags_original, status) VALUES ($1,$2,$3,$4,$5,$6)",
            [productId, shopifyImageId, img.url, img.altText, (p.tags || []).join(", "), status]
          );
          console.log(`  Created image: ${img.url.split("/").pop()} alt="${img.altText}" status=${status}`);
        }
      }
    }

    // Show current DB state
    console.log("\n--- DB State ---");
    const stats = await pool.query(`
      SELECT 
        (SELECT count(*) FROM products WHERE shop_id = $1) as total_products,
        (SELECT count(*) FROM product_images WHERE product_id IN (SELECT id FROM products WHERE shop_id = $1)) as total_images,
        (SELECT count(*) FROM product_images WHERE product_id IN (SELECT id FROM products WHERE shop_id = $1) AND alt_text_original IS NOT NULL) as images_with_alt,
        (SELECT count(*) FROM product_images WHERE product_id IN (SELECT id FROM products WHERE shop_id = $1) AND alt_text_ai IS NOT NULL) as images_with_ai,
        (SELECT count(*) FROM product_images WHERE product_id IN (SELECT id FROM products WHERE shop_id = $1) AND status = 'pending') as pending
    `, [shopId]);
    const s = stats.rows[0];
    console.log(`Products: ${s.total_products}, Images: ${s.total_images}, With alt: ${s.images_with_alt}, AI: ${s.images_with_ai}, Pending: ${s.pending}`);

    // List all products
    const prods = await pool.query(
      "SELECT id, title, handle, image_count FROM products WHERE shop_id = $1",
      [shopId]
    );
    for (const p of prods.rows) {
      const imgs = await pool.query(
        "SELECT id, shopify_image_id, alt_text_original, alt_text_ai, status FROM product_images WHERE product_id = $1",
        [p.id]
      );
      console.log(`\n  Product: ${p.title} (handle=${p.handle}, img_count=${p.image_count})`);
      for (const img of imgs.rows) {
        console.log(`    Image ${img.shopify_image_id}: alt_orig="${img.alt_text_original}", alt_ai="${img.alt_text_ai}", status=${img.status}`);
      }
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
