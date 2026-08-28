// Sync Shopify products to Neon DB via HTTP APIs (no pg driver needed)
const SHOPIFY_DOMAIN = 'haimo-dev.myshopify.com';
const ACCESS_TOKEN = 'shpua_b7beb37d771b4facf895253f7b9a1153';
const NEON_CONN = 'postgresql://neondb_owner:npg_CvTm34pbMXrA@ep-odd-butterfly-axac1xp4-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require';

// Parse Neon connection for HTTP API
const DB_URL = new URL(NEON_CONN);
const NEON_HOST = DB_URL.hostname;
const NEON_DB = DB_URL.pathname.slice(1).split('?')[0];
const NEON_USER = DB_URL.username;
const NEON_PASS = DB_URL.password;

console.log('Neon host:', NEON_HOST);
console.log('Neon db:', NEON_DB);

// Step 1: Fetch products from Shopify
async function fetchShopifyProducts() {
  const query = `{
    products(first: 50) {
      edges {
        node {
          id
          title
          handle
          description
          status
          images(first: 10) {
            edges {
              node {
                id
                url
                altText
              }
            }
          }
          variants(first: 5) {
            edges {
              node {
                id
                title
                sku
              }
            }
          }
        }
      }
    }
  }`;

  const res = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2024-10/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': ACCESS_TOKEN,
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.data.products.edges;
}

// Step 2: Execute SQL on Neon via HTTP
async function neonSQL(sql, params = []) {
  const auth = Buffer.from(`${NEON_USER}:${NEON_PASS}`).toString('base64');
  const url = `https://${NEON_HOST}/v2/sql`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Neon SQL error ${res.status}: ${text}`);
  }

  return await res.json();
}

// Step 3: Main sync logic
async function main() {
  console.log('Fetching products from Shopify...');
  const edges = await fetchShopifyProducts();
  console.log(`Found ${edges.length} products`);

  const shopDomain = SHOPIFY_DOMAIN;
  
  // Ensure shop exists
  const shopSQL = `INSERT INTO shops (domain, "installedAt", "planName") 
    VALUES ($1, NOW(), 'Free') 
    ON CONFLICT (domain) DO UPDATE SET "updatedAt" = NOW()
    RETURNING id`;
  
  console.log('Ensuring shop exists...');
  const shopResult = await neonSQL(shopSQL, [shopDomain]);
  console.log('Shop result:', JSON.stringify(shopResult));
  
  const shopId = shopResult[0]?.rows?.[0]?.id || 1;
  console.log('Shop ID:', shopId);

  for (const edge of edges) {
    const product = edge.node;
    const shopifyId = product.id.split('/').pop();
    console.log(`\nSyncing product: ${product.title} (ID: ${shopifyId})`);

    // Upsert product
    const productSQL = `INSERT INTO products ("shopId", "shopifyProductId", title, handle, description, status, "syncedAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT ("shopId", "shopifyProductId") DO UPDATE SET
        title = $3, handle = $4, description = $5, status = $6, "syncedAt" = NOW(), "updatedAt" = NOW()
      RETURNING id`;
    
    const productResult = await neonSQL(productSQL, [
      shopId, shopifyId, product.title, product.handle, 
      product.description || '', product.status
    ]);
    console.log('Product upserted:', JSON.stringify(productResult[0]?.rows?.[0]?.id));
    const productId = productResult[0]?.rows?.[0]?.id;

    // Upsert images
    for (const imgEdge of product.images.edges) {
      const img = imgEdge.node;
      const imgShopifyId = img.id.split('/').pop();
      
      const imageSQL = `INSERT INTO product_images ("productId", "shopifyImageId", "imageUrl", "altTextOriginal", "altTextAi", "hasAltText", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $4, $5, NOW(), NOW())
        ON CONFLICT ("productId", "shopifyImageId") DO UPDATE SET
          "imageUrl" = $3, "altTextOriginal" = $4, "hasAltText" = $5, "updatedAt" = NOW()
        RETURNING id`;
      
      const hasAlt = img.altText != null && img.altText !== '';
      const imageResult = await neonSQL(imageSQL, [
        productId, imgShopifyId, img.url, img.altText || null, hasAlt
      ]);
      console.log(`  Image ${imgShopifyId}: alt="${img.altText || 'NULL'}" hasAlt=${hasAlt}`);
    }
  }

  console.log('\n✅ Sync complete!');
  
  // Verify counts
  const countResult = await neonSQL('SELECT COUNT(*) as cnt FROM products');
  console.log('Total products in DB:', countResult[0]?.rows?.[0]?.cnt);
  
  const imgCount = await neonSQL('SELECT COUNT(*) as cnt FROM product_images');
  console.log('Total images in DB:', imgCount[0]?.rows?.[0]?.cnt);
  
  const noAltCount = await neonSQL(`SELECT COUNT(*) as cnt FROM product_images WHERE "hasAltText" = false`);
  console.log('Images without alt:', noAltCount[0]?.rows?.[0]?.cnt);
}

main().catch(err => {
  console.error('Sync failed:', err.message);
  process.exit(1);
});
