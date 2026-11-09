# AltOptimizer Demo Screencast v2 — 录制分镜

目标：替换现有 demo-screencast.mp4，消除「Quota nearly exhausted / 0 quota remaining」红色横幅与灰色按钮。

总时长：约 47 秒 · 1920×1080 · 30fps · 英文界面 + 英文字幕

---

## 录前检查（必做）

1. 打开 AltOptimizer → Generate，**右上角必须显示 `49 quota remaining` 之类的数字，不能是 `0 quota remaining`**
2. **不能出现红色 `Quota nearly exhausted` 横幅**
3. 浏览器缩放到 100%，关掉书签栏、隐藏其他标签页
4. 关闭所有通知弹窗

---

## 分镜

| 时间 | 画面 | 操作 | 底部英文字幕 |
|---|---|---|---|
| 0–4s | 开场卡 | 静态 | `AI product optimizer for Shopify` |
| 4–10s | Shopify Admin → Products | 缓慢下滚，露出 14 个商品 | `Your Shopify catalog: 14 products, synced in one click` |
| 10–16s | AltOptimizer → Generate | 选 `Product Tags`，勾选 **AI Test Mug** 和 **Bamboo Cutting Board** | `Choose Product Tags, then pick any product individually - or page through the rest` |
| 16–18s | 同一页 | 点 `Page 2` 再点回 `Page 1` | `All 14 products are reachable: 10 per page, every row selectable` |
| 18–24s | 点 `Generate Tags` | 等 `Generation Results (2 succeeded, 0 failed)` 出现，停顿 2 秒 | `AI-generated tags are saved to each product` |
| 24–30s | 切 Generation Type | 下拉选 `JSON-LD Structured Data` | `Switch to JSON-LD structured data - available for every product` |
| 30–36s | 点 `Generate JSON-LD` | 等绿色成功横幅出现 | `Structured data is saved and injected into your storefront theme` |
| 36–42s | 回商品列表 | 缓慢下滚，14 行全是绿色 `Complete` | `All 14 products show Complete - nothing is hidden` |
| 42–47s | 收尾卡 | 静态 | `Alt text / Product tags / JSON-LD structured data` |

---

## 硬性要求

- 全程**不能**出现红色 `Quota nearly exhausted` 或 `0 quota remaining`
- 全程**不能**出现灰色不可点的 `Generate Tags` / `Generate JSON-LD` 按钮
- 界面语言全英文，字幕全英文
- 不要出现浏览器地址栏里的 vercel.app（审核员不需要看到）

## 录后交付

- 分辨率 1920×1080，H.264，mp4
- 时长 45–50 秒
- 文件大小 < 5MB（当前是 1.27MB，说明码率低也够用）
- 交付后我会核对 md5、ffprobe、逐帧抽检，再替换 jsDelivr 上的文件
