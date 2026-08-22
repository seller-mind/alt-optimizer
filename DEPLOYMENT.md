# AltOptimizer Deployment Guide

## Prerequisites

1. **Shopify Partner Account** — [Create one](https://partners.shopify.com/signup) if you don't have one
2. **OpenAI API Key** — Get one from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
3. **Node.js 18+** and **pnpm** installed

---

## Step 1: Create a Shopify App

1. Go to [Shopify Partners](https://partners.shopify.com) → **Apps** → **Create App**
2. Choose **"Build manually"** (not using CLI)
3. Set **App name**: `AltOptimizer`
4. Under **Configuration**:
   - **App URL**: `https://your-app-domain.com` (set after deployment)
   - **Allowed redirection URL(s)**: `https://your-app-domain.com/auth/callback` and `https://your-app-domain.com/auth/shopify/callback`
   - Set these after deployment or use a tunnel URL during development

---

## Step 2: Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env .env
```

Required variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `SHOPIFY_API_KEY` | Shopify App API Key | `abc123...` |
| `SHOPIFY_API_SECRET` | Shopify App Secret | `xyz789...` |
| `SHOPIFY_APP_URL` | Your app's public URL | `https://altoptimizer.example.com` |
| `OPENAI_API_KEY` | OpenAI API Key | `sk-proj-...` |
| `DATABASE_URL` | SQLite database path | `file:./dev.db` |
| `HOST` | Same as SHOPIFY_APP_URL | `https://altoptimizer.example.com` |

---

## Step 3: App Scopes & Webhooks

The `shopify.app.toml` file is pre-configured with the required scopes:

```toml
[access_scopes]
scopes = "read_products,write_products,read_themes,write_themes"
```

Registered webhooks:
- `APP_UNINSTALLED` — `/webhooks/app/uninstalled`
- `SHOP_REDACT` — `/webhooks/shop/redact`
- `CUSTOMERS_DATA_REQUEST` — `/webhooks/customers/data_request`
- `APP_SUBSCRIPTIONS_UPDATE` — `/webhooks/billing/update`
- `APP_SUBSCRIPTIONS_DECLINE` — `/webhooks/billing/decline`

---

## Step 4: Deploy

### Option A: Deploy to Fly.io (Recommended)

1. Install the Fly CLI:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. Create a Fly app:
   ```bash
   fly launch --name altoptimizer --region iad
   ```

3. Set environment variables:
   ```bash
   fly secrets set SHOPIFY_API_KEY=your_key
   fly secrets set SHOPIFY_API_SECRET=your_secret
   fly secrets set SHOPIFY_APP_URL=https://altoptimizer.fly.dev
   fly secrets set OPENAI_API_KEY=your_openai_key
   fly secrets set HOST=https://altoptimizer.fly.dev
   ```

4. For production, use a PostgreSQL database instead of SQLite:
   ```bash
   fly postgres create --name altoptimizer-db
   fly postgres attach altoptimizer-db
   ```
   Then update `DATABASE_URL` to the PostgreSQL connection string.

5. Deploy:
   ```bash
   fly deploy
   ```

### Option B: Deploy to Railway

1. Push your code to a GitHub repository
2. Go to [Railway](https://railway.app) → **New Project** → **Deploy from GitHub repo**
3. In **Settings** → **Environment Variables**, add all variables from `.env`
4. Railway auto-detects the build command from `package.json`

### Option C: Deploy to Vercel

1. Install Vercel CLI:
   ```bash
   pnpm add -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Set environment variables in Vercel dashboard:
   ```bash
   vercel env add SHOPIFY_API_KEY
   vercel env add SHOPIFY_API_SECRET
   vercel env add SHOPIFY_APP_URL
   vercel env add OPENAI_API_KEY
   vercel env add HOST
   ```

---

## Step 5: Test with a Development Store

1. In your Shopify Partner Dashboard, go to **Stores** → **Create development store**
2. Install the app on your dev store via the Shopify Admin
3. Approve the required scopes during installation
4. You should see the AltOptimizer dashboard

---

## Step 6: Configure Billing Plans (Shopify Recurring Charges)

The app ships with 4 pre-configured billing plans. When you deploy:

1. The app auto-creates subscription plans using Shopify's Billing API
2. Prices are configured in `app/shopify.server.ts` under the `billing` config
3. Plan tiers:
   - **Free**: 50 images/month — $0
   - **Starter**: 300 images/month — $9/month
   - **Professional**: 1,000 images/month — $19/month (Recommended)
   - **Business**: 5,000 images/month — $49/month

---

## Step 7: Submit to Shopify App Store

1. In your Shopify Partner Dashboard, go to **Apps** → select your app
2. Complete the **App Listing**:
   - Fill in description, screenshots, and category
   - Upload app icon (512x512px)
   - Set privacy policy URL to `https://your-app.com/privacy`
   - Set terms of service URL to `https://your-app.com/terms`
3. Complete the **App Requirements** checklist
4. Submit for review

---

## Development

### Local Development with Tunnel

Use `ngrok` or `cloudflared` to expose your local server:

```bash
# Terminal 1: Start the dev server
pnpm run dev

# Terminal 2: Create a tunnel
cloudflared tunnel --url http://localhost:5000
```

Update your Shopify app configuration:
- **App URL**: `https://your-tunnel-url.trycloudflare.com`
- **Allowed redirection URL(s)**: `https://your-tunnel-url.trycloudflare.com/auth/callback`

### Database Management

```bash
# Push schema changes to database
npx prisma db push

# Open Prisma Studio (GUI database browser)
npx prisma studio

# Generate Prisma client after schema changes
npx prisma generate

# Reset database (deletes all data)
npx prisma db push --force-reset
```

### Production Database

For production, replace SQLite with PostgreSQL:

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

---

## Troubleshooting

### "App URL configuration invalid"
- Ensure `SHOPIFY_APP_URL` and `HOST` match exactly (including https://)
- Check that the redirect URLs in the Partner Dashboard match exactly

### "Session storage not initialized"
- Run `npx prisma db push` to create the database tables
- Ensure the `Session` table exists in your database

### "OpenAI API errors"
- Verify your `OPENAI_API_KEY` is correct and has sufficient quota
- Check that the API key has access to the `gpt-4o` model

### "Webhook not triggering"
- Ensure the webhook URL is publicly accessible
- Check Shopify Admin → Settings → Notifications → Webhooks
- Verify HMAC signature verification in server logs

### "Billing not working"
- Ensure the app is installed on a Shopify store with a valid payment method
- Check that the billing plan IDs match between configuration and Shopify
- Verify the `billing` configuration in `app/shopify.server.ts`

---

## Support

For issues or questions, contact: support@altoptimizer.com