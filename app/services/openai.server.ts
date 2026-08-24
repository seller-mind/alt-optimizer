import OpenAI from "openai";

/**
 * OpenAI GPT-4o client for image analysis and content generation.
 * Uses the OPENAI_API_KEY environment variable for authentication.
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

/** Maximum number of retries for invalid API responses */
const MAX_RETRIES = 3;

/** Parsed result from image analysis */
interface ImageAnalysisResult {
  objects: string[];
  colors: string[];
  context: string;
  category: string;
}

/** Result of alt text generation */
interface AltTextResult {
  altText: string;
  analysis: ImageAnalysisResult;
}

/** Result of tag generation */
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

/**
 * Validate that the environment is properly configured.
 * Throws if OPENAI_API_KEY is missing.
 */
export function validateEnvironment(): void {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY environment variable is not set. " +
      "Please add it to your .env file. You can get an API key from https://platform.openai.com/api-keys"
    );
  }
}

/**
 * Analyze a product image and generate SEO-optimized alt text.
 * Retries up to MAX_RETRIES times if the API returns invalid/empty responses.
 *
 * @param imageBase64 - Base64-encoded image data
 * @param mimeType - MIME type of the image (e.g., "image/jpeg")
 * @param productTitle - Optional product title for context
 * @param locale - Locale for output language (default: "en")
 * @returns AltTextResult with generated alt text and analysis
 */
export async function analyzeImage(
  imageBase64: string,
  mimeType: string,
  productTitle?: string,
  locale: string = "en"
): Promise<AltTextResult> {
  validateEnvironment();
  const localeInstruction = getLocaleInstruction(locale);
  const dataUrl = `data:${mimeType};base64,${imageBase64}`;

  const userMessage = productTitle
    ? `Product title: "${productTitle}"\n\n${localeInstruction}`
    : localeInstruction;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
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

      // Validate that we got meaningful data
      if (parsed.altText && parsed.altText.length > 0) {
        return {
          altText: parsed.altText.substring(0, 125),
          analysis: parsed.analysis || { objects: [], colors: [], context: "", category: "" },
        };
      }

      // Invalid/empty response — retry
      lastError = new Error("Empty alt text in response");
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      // On rate limit or server errors, wait before retry
      if (error instanceof OpenAI.RateLimitError || error instanceof OpenAI.APIError) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  // All retries exhausted
  return {
    altText: "",
    analysis: { objects: [], colors: [], context: "", category: "" },
  };
}

/**
 * Generate relevant product tags based on image, title, and description.
 * Retries up to MAX_RETRIES times if the API returns invalid/empty responses.
 *
 * @param imageBase64 - Base64-encoded image data
 * @param mimeType - MIME type of the image
 * @param productTitle - Product title
 * @param productDescription - Product description
 * @param locale - Locale for output language (default: "en")
 * @returns TagsResult with generated tags array
 */
export async function generateTags(
  imageBase64: string,
  mimeType: string,
  productTitle: string,
  productDescription: string,
  locale: string = "en"
): Promise<TagsResult> {
  validateEnvironment();
  const localeInstruction = getLocaleInstruction(locale);
  const dataUrl = `data:${mimeType};base64,${imageBase64}`;

  const userMessage = `Product Title: "${productTitle}"
Product Description: "${productDescription || "No description available"}"

${localeInstruction}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
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

      if (parsed.tags && Array.isArray(parsed.tags) && parsed.tags.length > 0) {
        return { tags: parsed.tags };
      }

      lastError = new Error("Empty tags in response");
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (error instanceof OpenAI.RateLimitError || error instanceof OpenAI.APIError) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  return { tags: [] };
}

/**
 * Generate JSON-LD structured data for a product (no AI needed).
 * Creates a Schema.org/Product JSON-LD object.
 *
 * @param product - Product data
 * @param shopDomain - Shopify store domain
 * @returns JSON-LD string
 */
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

/**
 * Get locale-specific instruction text for AI responses.
 * Supports 10 languages.
 */
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