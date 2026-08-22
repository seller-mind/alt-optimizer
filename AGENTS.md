# AGENTS.md - AltOptimizer

## Project Overview
AltOptimizer is a Shopify embedded app that uses AI (Google Gemini) to optimize product images with SEO-friendly alt text, tags, and JSON-LD structured data.

## Tech Stack
- **Framework**: Remix (Shopify App Remix)
- **UI**: Shopify Polaris v12
- **Database**: SQLite via Prisma ORM
- **AI**: Google Gemini 2.0 Flash
- **Language**: TypeScript

## Key Commands
```bash
pnpm install          # Install dependencies
pnpm run dev          # Start dev server
pnpm run build        # Build for production
pnpm run start        # Start production server
npx prisma generate   # Regenerate Prisma client
npx prisma db push    # Sync schema to database
```

## Project Structure
```
app/
├── routes/           # Remix route files
│   ├── app.tsx       # App layout with navigation
│   ├── app._index.tsx    # Dashboard
│   ├── app.products.tsx  # Product listing & sync
│   ├── app.generate.tsx  # AI generation (alt text, tags, JSON-LD)
│   ├── app.review.tsx    # Review & approval interface
│   ├── app.backup.tsx    # Backup & restore
│   ├── app.settings.tsx  # Settings & billing
│   ├── webhooks.tsx      # Shopify webhook handlers
│   └── auth.$.tsx        # Auth callback
├── services/         # Server-side services
│   ├── gemini.server.ts    # AI generation
│   ├── shopify.server.ts   # Shopify Admin API
│   ├── billing.server.ts   # Quota & usage tracking
│   ├── backup.server.ts    # Backup & restore
│   └── sync.server.ts      # Product sync & data queries
├── components/       # Shared UI components
│   ├── AppNav.tsx    # Navigation bar
│   └── Boundary.tsx  # Error boundary
├── constants.ts      # Shared constants (PLANS, types)
├── db.server.ts      # Prisma client singleton
├── shopify.server.ts # Shopify app configuration
├── root.tsx          # Root layout with Polaris
├── entry.server.tsx  # Server entry point
└── entry.client.tsx  # Client entry point
prisma/
└── schema.prisma     # Database schema
```

## Database Models
- **Shop**: Store connection, plan, access token
- **Product**: Synced Shopify products
- **ProductImage**: Image data with original/AI alt text
- **AltTextHistory**: Change history for alt text
- **BackupSnapshot**: Timestamped backup data
- **UsageMetric**: Monthly generation tracking

## Environment Variables
- `SHOPIFY_API_KEY` - Shopify app API key
- `SHOPIFY_API_SECRET` - Shopify app secret
- `GEMINI_API_KEY` - Google Gemini API key
- `DATABASE_URL` - SQLite database URL (default: file:./dev.db)

## Important Notes
- Server-only code uses `.server.ts` suffix (not bundled for client)
- Shared constants go in `constants.ts` (not `.server.ts`)
- All Shopify API calls go through `shopify.server.ts`
- AI generation uses Gemini 2.0 Flash model
- Quota tracking is per-shop, per-month
