import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import {
  createGenerationHistory,
  getGenerationHistoryByUserId,
  getGenerationHistoryById,
  updateGenerationHistory,
  deleteGenerationHistory,
  createBrandAsset,
  getBrandAssetsByUserId,
  getBrandAssetById,
  updateBrandAsset,
  deleteBrandAsset,
} from "./db";

// Style options for content generation
const STYLE_OPTIONS = ["专业稳重", "活泼创意", "科技感", "简约大气", "温馨亲切"] as const;

// Platform options for multi-platform adaptation
const PLATFORM_OPTIONS = ["微信公众号", "小红书", "抖音", "微博", "知乎"] as const;

// Helper to clean JSON string from markdown code blocks
function cleanJsonString(input: string): string {
  let cleaned = input.trim();
  // Remove markdown code blocks
  cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
  return cleaned;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Content Generation Router
  generate: router({
    // Generate all marketing content (prospectus, video script, poster elements)
    content: protectedProcedure
      .input(z.object({
        prompt: z.string().min(1).max(2000),
        style: z.enum(STYLE_OPTIONS),
      }))
      .mutation(async ({ ctx, input }) => {
        const systemPrompt = `你是一名顶级的营销策划专家和内容创作者，尤其擅长根据简单的客户需求，快速构思并撰写适用于多个营销渠道的全套宣传物料。

现在，请根据以下客户需求，为我生成一套完整的营销内容。请严格按照下面指定的JSON格式输出，确保每个字段都内容详实且符合渠道调性。

**输出风格要求**："${input.style}"

**重要内容要求**：
1. 输出的文本内容（如text、voiceover等）必须是纯文本，**严禁使用Markdown格式符号**（如 **加粗**、## 标题、- 列表符等）。
2. 请直接使用自然的段落和标点符号来组织内容。

**请按以下JSON格式输出**：
{
  "prospectus": {
    "title": "招商文案标题",
    "sections": [
      {"subtitle": "一、项目概览", "text": "项目背景、定位和核心价值的详细介绍"},
      {"subtitle": "二、核心优势", "text": "分点阐述项目的地理位置、政策支持、产业生态、人才资源等核心优势"},
      {"subtitle": "三、合作模式与入驻流程", "text": "说明合作方式、优惠政策以及详细的入驻申请流程"},
      {"subtitle": "四、联系我们", "text": "提供联系方式和地址"}
    ]
  },
  "videoScript": {
    "title": "短视频标题",
    "totalDuration": 60,
    "scenes": [
      {
        "sceneNumber": 1,
        "duration": 5,
        "visuals": "镜头画面描述",
        "voiceover": "旁白或台词",
        "bgmSuggestion": "背景音乐风格建议"
      }
    ]
  },
  "posterElements": {
    "mainHeadline": "海报主标题",
    "subHeadline": "副标题",
    "bodyText": "核心宣传语或活动详情",
    "callToAction": "引导用户行动的文字"
  }
}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `客户核心需求：${input.prompt}` },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "marketing_content",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  prospectus: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      sections: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            subtitle: { type: "string" },
                            text: { type: "string" }
                          },
                          required: ["subtitle", "text"],
                          additionalProperties: false
                        }
                      }
                    },
                    required: ["title", "sections"],
                    additionalProperties: false
                  },
                  videoScript: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      totalDuration: { type: "number" },
                      scenes: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            sceneNumber: { type: "number" },
                            duration: { type: "number" },
                            visuals: { type: "string" },
                            voiceover: { type: "string" },
                            bgmSuggestion: { type: "string" }
                          },
                          required: ["sceneNumber", "duration", "visuals", "voiceover", "bgmSuggestion"],
                          additionalProperties: false
                        }
                      }
                    },
                    required: ["title", "totalDuration", "scenes"],
                    additionalProperties: false
                  },
                  posterElements: {
                    type: "object",
                    properties: {
                      mainHeadline: { type: "string" },
                      subHeadline: { type: "string" },
                      bodyText: { type: "string" },
                      callToAction: { type: "string" }
                    },
                    required: ["mainHeadline", "subHeadline", "bodyText", "callToAction"],
                    additionalProperties: false
                  }
                },
                required: ["prospectus", "videoScript", "posterElements"],
                additionalProperties: false
              }
            }
          }
        });

        const messageContent = response.choices[0].message.content;
        const rawContent = typeof messageContent === 'string' ? messageContent : JSON.stringify(messageContent) || "{}";
        const content = JSON.parse(cleanJsonString(rawContent));

        // Save to database
        const historyId = await createGenerationHistory({
          userId: ctx.user.id,
          prompt: input.prompt,
          style: input.style,
          prospectusContent: content.prospectus,
          videoScriptContent: content.videoScript,
          posterElements: content.posterElements,
        });

        return { id: historyId, ...content };
      }),

    // Generate poster image
    poster: protectedProcedure
      .input(z.object({
        historyId: z.number(),
        mainHeadline: z.string(),
        subHeadline: z.string(),
        bodyText: z.string(),
        style: z.enum(STYLE_OPTIONS),
      }))
      .mutation(async ({ ctx, input }) => {
        const styleMap: Record<string, string> = {
          "专业稳重": "professional corporate style, clean layout, blue and white color scheme",
          "活泼创意": "vibrant creative style, colorful, dynamic composition, playful elements",
          "科技感": "futuristic tech style, dark background, neon accents, geometric shapes",
          "简约大气": "minimalist elegant style, lots of white space, subtle colors",
          "温馨亲切": "warm friendly style, soft colors, rounded shapes, inviting atmosphere"
        };

        const prompt = `Professional marketing poster design, ${styleMap[input.style] || "modern style"}.
Main headline: "${input.mainHeadline}"
Subtitle: "${input.subHeadline}"
Body text: "${input.bodyText}"
Requirements: clean typography, professional layout, high contrast text, modern design, 8k quality, no text distortion`;

        const { url } = await generateImage({ prompt });

        // Update history with poster URL
        await updateGenerationHistory(input.historyId, { posterUrl: url });

        return { posterUrl: url };
      }),

    // Generate platform-specific content
    platformContent: protectedProcedure
      .input(z.object({
        historyId: z.number(),
        originalContent: z.string(),
        platforms: z.array(z.enum(PLATFORM_OPTIONS)),
        style: z.enum(STYLE_OPTIONS),
      }))
      .mutation(async ({ ctx, input }) => {
        const platformRequirements: Record<string, string> = {
          "微信公众号": "适合深度阅读，可以较长，需要有吸引人的开头和结尾，适当使用emoji，段落清晰",
          "小红书": "简短精炼，使用大量emoji，分点列出，标题要吸睛，适合种草风格，控制在500字以内",
          "抖音": "极简文案，适合配合短视频，突出重点，使用流行语，控制在100字以内",
          "微博": "简洁有力，适合快速传播，可以使用话题标签#，控制在140字以内",
          "知乎": "专业深度，逻辑清晰，可以较长，适合问答形式，引用数据和案例"
        };

        const systemPrompt = `你是一名资深的新媒体运营专家，擅长将营销内容适配到不同平台。请根据原始内容，为指定的平台生成适配版本。

风格要求：${input.style}

**重要内容要求**：
1. 输出的文本内容必须是纯文本，**严禁使用Markdown格式符号**（如 **加粗**、## 标题、- 列表符等）。
2. 即使是列点，也请使用数字序号或直接分行，不要使用Markdown的列表符号。
3. 表情符号（emoji）可以使用。

请为以下平台生成适配内容，严格按照JSON格式输出：
${input.platforms.map(p => `- ${p}：${platformRequirements[p]}`).join('\n')}

输出格式：
{
  "platforms": {
    "平台名称": {
      "title": "标题",
      "content": "正文内容",
      "hashtags": ["标签1", "标签2"]
    }
  }
}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `原始内容：${input.originalContent}` },
          ],
        });

        const platformMessageContent = response.choices[0].message.content;
        const rawPlatformContent = typeof platformMessageContent === 'string' ? platformMessageContent : JSON.stringify(platformMessageContent) || "{}";
        const platformContents = JSON.parse(cleanJsonString(rawPlatformContent));

        // Update history with platform contents
        await updateGenerationHistory(input.historyId, { platformContents });

        return platformContents;
      }),
  }),

  // History Router
  history: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(20) }).optional())
      .query(async ({ ctx, input }) => {
        return await getGenerationHistoryByUserId(ctx.user.id, input?.limit || 20);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const history = await getGenerationHistoryById(input.id);
        if (!history || history.userId !== ctx.user.id) {
          throw new Error("History not found");
        }
        return history;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        prospectusContent: z.any().optional(),
        videoScriptContent: z.any().optional(),
        posterElements: z.any().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const history = await getGenerationHistoryById(input.id);
        if (!history || history.userId !== ctx.user.id) {
          throw new Error("History not found");
        }
        await updateGenerationHistory(input.id, {
          prospectusContent: input.prospectusContent,
          videoScriptContent: input.videoScriptContent,
          posterElements: input.posterElements,
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const history = await getGenerationHistoryById(input.id);
        if (!history || history.userId !== ctx.user.id) {
          throw new Error("History not found");
        }
        await deleteGenerationHistory(input.id);
        return { success: true };
      }),
  }),

  // Brand Assets Router
  assets: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getBrandAssetsByUserId(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        type: z.enum(["logo", "color", "image", "font"]),
        url: z.string().optional(),
        value: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createBrandAsset({
          userId: ctx.user.id,
          ...input,
        });
        return { id };
      }),

    upload: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        type: z.enum(["logo", "image"]),
        fileData: z.string(), // base64 encoded
        mimeType: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.fileData, "base64");
        const ext = input.mimeType.split("/")[1] || "png";
        const fileKey = `brand-assets/${ctx.user.id}/${nanoid()}.${ext}`;
        
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        
        const id = await createBrandAsset({
          userId: ctx.user.id,
          name: input.name,
          type: input.type,
          url,
          description: input.description,
        });
        
        return { id, url };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        value: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const asset = await getBrandAssetById(input.id);
        if (!asset || asset.userId !== ctx.user.id) {
          throw new Error("Asset not found");
        }
        await updateBrandAsset(input.id, {
          name: input.name,
          value: input.value,
          description: input.description,
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const asset = await getBrandAssetById(input.id);
        if (!asset || asset.userId !== ctx.user.id) {
          throw new Error("Asset not found");
        }
        await deleteBrandAsset(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
