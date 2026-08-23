-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "access_token" TEXT NOT NULL DEFAULT '',
    "user_id" BIGINT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shops" (
    "id" SERIAL NOT NULL,
    "shop_domain" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "plan_type" TEXT NOT NULL DEFAULT 'free',
    "installed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',
    "locale" TEXT NOT NULL DEFAULT 'en',
    "charge_id" TEXT,
    "uninstall_date" TIMESTAMP(3),
    "data_retention_until" TIMESTAMP(3),
    "last_quota_reset_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "shop_id" INTEGER NOT NULL,
    "shopify_product_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "image_count" INTEGER NOT NULL DEFAULT 0,
    "has_json_ld" BOOLEAN NOT NULL DEFAULT false,
    "json_ld_data" TEXT,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "shopify_image_id" TEXT NOT NULL,
    "src" TEXT NOT NULL,
    "alt_text_original" TEXT,
    "alt_text_ai" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "tags_original" TEXT,
    "tags_ai" TEXT,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alt_text_history" (
    "id" SERIAL NOT NULL,
    "image_id" INTEGER NOT NULL,
    "alt_text" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'ai',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alt_text_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backup_snapshots" (
    "id" SERIAL NOT NULL,
    "shop_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "record_count" INTEGER NOT NULL DEFAULT 0,
    "data" TEXT NOT NULL,

    CONSTRAINT "backup_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_metrics" (
    "id" SERIAL NOT NULL,
    "shop_id" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "images_generated" INTEGER NOT NULL DEFAULT 0,
    "tags_generated" INTEGER NOT NULL DEFAULT 0,
    "json_ld_generated" INTEGER NOT NULL DEFAULT 0,
    "api_calls" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "usage_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shops_shop_domain_key" ON "shops"("shop_domain");

-- CreateIndex
CREATE UNIQUE INDEX "products_shop_id_shopify_product_id_key" ON "products"("shop_id", "shopify_product_id");

-- CreateIndex
CREATE UNIQUE INDEX "usage_metrics_shop_id_date_key" ON "usage_metrics"("shop_id", "date");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alt_text_history" ADD CONSTRAINT "alt_text_history_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "product_images"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backup_snapshots" ADD CONSTRAINT "backup_snapshots_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_metrics" ADD CONSTRAINT "usage_metrics_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
