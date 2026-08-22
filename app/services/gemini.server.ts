import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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

export async function analyzeImage(
  imageBase64: string,
  mimeType: string,
  productTitle?: string,
  locale: string = "en"
): Promise<AltTextResult> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const localeInstruction = getLocaleInstruction(locale);

  const prompt = `You are an SEO expert specializing in e-commerce product image optimization.
Analyze this product image and generate SEO-optimized alt text.

${productTitle ? `Product title: "${productTitle}"` : ""}

Requirements:
- Alt text must be under 125 characters
- Describe the main product/object clearly
- Include relevant visual details (color, material, style)
- ${localeInstruction}
- Be specific and descriptive for accessibility
- Include key product attributes that help with SEO

Respond in this exact JSON format:
{
  "altText": "the generated alt text",
  "analysis": {
    "objects": ["list of detected objects"],
    "colors": ["detected colors"],
    "context": "brief scene/context description",
    "category": "product category"
  }
}`;

  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType,
    },
  };

  const result = await model.generateContent([prompt, imagePart]);
  const response = result.response;
  const text = response.text();

  try {
    const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleanedText);
    return {
      altText: parsed.altText || "",
      analysis: parsed.analysis || { objects: [], colors: [], context: "", category: "" },
    };
  } catch {
    return {
      altText: text.substring(0, 125),
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
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const localeInstruction = getLocaleInstruction(locale);

  const prompt = `You are an e-commerce SEO expert. Generate relevant product tags based on the image, title, and description.

Product Title: "${productTitle}"
Product Description: "${productDescription || "No description available"}"

Requirements:
- Generate 5-10 relevant tags
- Include product type, style, color, material, occasion
- ${localeInstruction}
- Tags should be lowercase, hyphenated phrases
- Focus on discoverability and SEO value

Respond in this exact JSON format:
{
  "tags": ["tag1", "tag2", "tag3"]
}`;

  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType,
    },
  };

  const result = await model.generateContent([prompt, imagePart]);
  const response = result.response;
  const text = response.text();

  try {
    const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleanedText);
    return { tags: parsed.tags || [] };
  } catch {
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
