/**
 * Image generation helper using internal ImageService
 *
 * Example usage:
 *   const { url: imageUrl } = await generateImage({
 *     prompt: "A serene landscape with mountains"
 *   });
 *
 * For editing:
 *   const { url: imageUrl } = await generateImage({
 *     prompt: "Add a rainbow to this landscape",
 *     originalImages: [{
 *       url: "https://example.com/original.jpg",
 *       mimeType: "image/jpeg"
 *     }]
 *   });
 */
import { storagePut } from "server/storage";
import { ENV } from "./env";

export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{
    url?: string;
    b64Json?: string;
    mimeType?: string;
  }>;
};

export type GenerateImageResponse = {
  url?: string;
};

export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  // Use Zhipu AI if API key is configured
  if (ENV.zhipuApiKey) {
    try {
      const fullUrl = "https://open.bigmodel.cn/api/paas/v4/images/generations";
      
      console.log("[ImageGeneration] Using Zhipu AI CogView...");
      
      const response = await fetch(fullUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${ENV.zhipuApiKey}`,
        },
        body: JSON.stringify({
          model: "cogview-3-flash", // Changed to cogview-3-flash for cost efficiency
          prompt: options.prompt,
          size: "1024x1024",
        }),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(
          `Zhipu Image generation request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
        );
      }

      const result = (await response.json()) as {
        data: Array<{ url: string }>;
      };

      if (!result.data || result.data.length === 0 || !result.data[0].url) {
        throw new Error("No image URL returned from Zhipu AI");
      }

      // Since Zhipu returns a URL, we might want to proxy/download it to our storage 
      // to ensure persistence, as the URL might expire (doc says 30 days).
      // For now, let's download and upload to our storage like the original implementation.
      
      const imageUrl = result.data[0].url;
      console.log("[ImageGeneration] Zhipu generated URL:", imageUrl);
      
      try {
        const imageResponse = await fetch(imageUrl);
        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Save to S3 (or local mock storage)
        const { url } = await storagePut(
          `generated/${Date.now()}.png`,
          buffer,
          "image/png"
        );
        return { url };
      } catch (storageError) {
        console.warn("[ImageGeneration] Storage failed, returning original URL:", storageError);
        // Fallback: return the original Zhipu URL (valid for 30 days)
        return { url: imageUrl };
      }
    } catch (error) {
      console.error("[ImageGeneration] Zhipu AI generation failed:", error);
      console.warn("[ImageGeneration] Falling back to placeholder image");
      
      // Fallback to placeholder image if Zhipu fails (e.g. insufficient balance)
      return {
        url: `https://placehold.co/1024x1024/png?text=${encodeURIComponent("Image Generation Failed\n(Check API Balance)")}`
      };
    }
  }

  // Fallback to Forge if no Zhipu key
  if (!ENV.forgeApiUrl) {
    throw new Error("BUILT_IN_FORGE_API_URL is not configured");
  }
  if (!ENV.forgeApiKey) {
    throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
  }

  // Build the full URL by appending the service path to the base URL
  const baseUrl = ENV.forgeApiUrl.endsWith("/")
    ? ENV.forgeApiUrl
    : `${ENV.forgeApiUrl}/`;
  const fullUrl = new URL(
    "images.v1.ImageService/GenerateImage",
    baseUrl
  ).toString();

  const response = await fetch(fullUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "connect-protocol-version": "1",
      authorization: `Bearer ${ENV.forgeApiKey}`,
    },
    body: JSON.stringify({
      prompt: options.prompt,
      original_images: options.originalImages || [],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Image generation request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }

  const result = (await response.json()) as {
    image: {
      b64Json: string;
      mimeType: string;
    };
  };
  const base64Data = result.image.b64Json;
  const buffer = Buffer.from(base64Data, "base64");

  // Save to S3
  const { url } = await storagePut(
    `generated/${Date.now()}.png`,
    buffer,
    result.image.mimeType
  );
  return {
    url,
  };
}
