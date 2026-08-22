import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

interface ImageAnalysisResult {
  objects: string[];
  colors: string[];
  context: string;
  category: string;
}

interface AltTextResult {
  altText: string;
  analysis: ImageAnalysisResult;
}

interface TagsResult {
  tags: string[];
}

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

export async function analyzeImage(
  imageBase64: string,
  mimeType: string,
  productTitle?: string,
  locale: string = "en"
): Promise<AltTextResult> {
  const localeInstruction = getLocaleInstruction(locale);
  const dataUrl = `data:${mimeType};base64,${imageBase64}`;

  const userMessage = productTitle
    ? `Product title: "${productTitle}"\n\n${localeInstruction}`
    : localeInstruction;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: ALT_TEXT_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: userMessage },
            { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    const text = response.choices[0]?.message?.content || "{}";
    const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleanedText);

    return {
      altText: parsed.altText?.substring(0, 125) || "",
      analysis: parsed.analysis || { objects: [], colors: [], context: "", category: "" },
    };
  } catch (error) {
    console.error("[OpenAI] analyzeImage error:", error);
    return {
      altText: "",
      analysis: { objects: [], colors: [], context: "", category: "" },
    };
  }
}

export async function generateTags(
  imageBase64: string,
  mimeType: string,
  productTitle: string,
  productDescription: string,
  locale: string = "en"
): Promise<TagsResult> {
  const localeInstruction = getLocaleInstruction(locale);
  const dataUrl = `data:${mimeType};base64,${imageBase64}`;

  const userMessage = `Product Title: "${productTitle}"
Product Description: "${productDescription || "No description available"}"

${localeInstruction}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: TAGS_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: userMessage },
            { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    const text = response.choices[0]?.message?.content || "{}";
    const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleanedText);

    return { tags: parsed.tags || [] };
  } catch (error) {
    console.error("[OpenAI] generateTags error:", error);
    return { tags: [] };
  }
}

export async function generateJsonLd(
  product: {
    title: string;
    description: string;
    handle: string;
    images: { src: string; altText?: string }[];
    price?: string;
    currency?: string;
    vendor?: string;
    sku?: string;
  },
  shopDomain: string
): Promise<string> {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description || product.title,
    image: product.images.map((img) => img.src),
    brand: {
      "@type": "Brand",
      name: product.vendor || shopDomain,
    },
    sku: product.sku || product.handle,
    offers: {
      "@type": "Offer",
      price: product.price || "0",
      priceCurrency: product.currency || "USD",
      availability: "https://schema.org/InStock",
      url: `https://${shopDomain}/products/${product.handle}`,
    },
  };

  return JSON.stringify(jsonLd, null, 2);
}

function getLocaleInstruction(locale: string): string {
  const localeMap: Record<string, string> = {
    en: "Write in English",
    es: "Write in Spanish",
    fr: "Write in French",
    de: "Write in German",
    pt: "Write in Portuguese",
    ja: "Write in Japanese",
    zh: "Write in Chinese",
    ko: "Write in Korean",
    it: "Write in Italian",
    nl: "Write in Dutch",
  };
  return localeMap[locale] || "Write in English";
}