# AltOptimizer — Proof of Resolution

Video URL (verified HTTP 200, md5 a0a09532fbd4e7a928f9c7f715153224, 45.1s / 1920x1080 / H.264):

https://cdn.jsdelivr.net/gh/seller-mind/alt-optimizer@35e6e03/public/demo-screencast.mp4

---

## Issue 1 — Include a demo screencast (4.5.3)

### Short version (single-line field)

https://cdn.jsdelivr.net/gh/seller-mind/alt-optimizer@35e6e03/public/demo-screencast.mp4

### Long version (multi-line field)

Demo screencast (45s, 1920x1080, English subtitles):
https://cdn.jsdelivr.net/gh/seller-mind/alt-optimizer@35e6e03/public/demo-screencast.mp4

The video demonstrates both required features end to end:

0:00  Title card - Alt text / Product tags / JSON-LD structured data
0:04  Products page - the store's full catalog
0:10  Generate tab, Generation Type = "Product Tags", two products selected individually, Generate Tags
0:16  Page 2 of 2 - footer reads "Showing 4 of 14 products", pagination control works
0:22  Generation Results (1 succeeded, 0 failed) - the generated tags are listed per product
0:28  Generation Type switched to "JSON-LD Structured Data", Generate JSON-LD
0:32  Green banner "Structured data generated for 2 products"
0:38  Page 1 - every product row shows Complete
0:42  Closing card

Every step shows the quota counter decreasing normally (49 -> 48 -> 46 remaining), so the flow is fully reproducible on a fresh install.

---

## Issue 2 — Build apps without critical errors (2.1.1)

### Short version (single-line field)

https://cdn.jsdelivr.net/gh/seller-mind/alt-optimizer@35e6e03/public/demo-screencast.mp4

### Long version (multi-line field)

The product list is no longer restricted to 4-6 products.

The app shows 10 products per page with a working pagination control. The store has 14 products and all of them are reachable across 2 pages:

- 0:16 - page 2, footer reads "Showing 4 of 14 products", pagination shows "Page 2 of 2"
- 0:38 - page 1, 10 rows listed, every row has its own checkbox

Each row is individually selectable. The toolbar counter updates as rows are checked ("1 selected" -> "2 selected" at 0:10), and the selected products are passed to the generation step.

The same selection flow drives alt text, product tags and JSON-LD generation. The screencast demonstrates the selection plus product-tag and JSON-LD generation to keep the video under one minute; alt text uses the identical selection and generation path.

App URL: https://admin.shopify.com/store/haimo-dev/apps/altoptimizer/app/products

---

## Pre-submit checklist

- [x] Video URL returns HTTP 200 (tested)
- [x] Downloaded file md5 matches local file: a0a09532fbd4e7a928f9c7f715153224
- [x] Video is H.264 / 1920x1080 / 30fps / 4.13 MB - plays inline in browsers
- [x] All on-screen text is English, all subtitles are English
- [x] No quota warning banner anywhere in the video
- [x] No browser chrome, address bar or OS taskbar visible
- [x] Build shown in the app footer: b0d3438 (matches the deployed code)
- [ ] Partner Dashboard: paste proof into both issue fields
- [ ] Partner Dashboard: click Submit / Resubmit
