import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the LLM and image generation modules
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          prospectus: {
            title: "测试招商文案标题",
            sections: [
              { subtitle: "一、项目概览", text: "测试项目概览内容" },
              { subtitle: "二、核心优势", text: "测试核心优势内容" }
            ]
          },
          videoScript: {
            title: "测试短视频标题",
            totalDuration: 60,
            scenes: [
              {
                sceneNumber: 1,
                duration: 10,
                visuals: "测试画面描述",
                voiceover: "测试旁白",
                bgmSuggestion: "轻快背景音乐"
              }
            ]
          },
          posterElements: {
            mainHeadline: "测试主标题",
            subHeadline: "测试副标题",
            bodyText: "测试正文",
            callToAction: "立即咨询"
          }
        })
      }
    }]
  })
}));

vi.mock("./_core/imageGeneration", () => ({
  generateImage: vi.fn().mockResolvedValue({
    url: "https://example.com/test-poster.png"
  })
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({
    url: "https://example.com/uploaded-file.png",
    key: "test-key"
  })
}));

vi.mock("./db", () => ({
  createGenerationHistory: vi.fn().mockResolvedValue(1),
  getGenerationHistoryByUserId: vi.fn().mockResolvedValue([
    {
      id: 1,
      userId: 1,
      prompt: "测试提示词",
      style: "专业稳重",
      prospectusContent: { title: "测试", sections: [] },
      videoScriptContent: { title: "测试", totalDuration: 60, scenes: [] },
      posterElements: { mainHeadline: "测试", subHeadline: "", bodyText: "", callToAction: "" },
      posterUrl: null,
      videoUrl: null,
      platformContents: null,
      createdAt: new Date()
    }
  ]),
  getGenerationHistoryById: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    prompt: "测试提示词",
    style: "专业稳重",
    prospectusContent: { title: "测试", sections: [] },
    videoScriptContent: { title: "测试", totalDuration: 60, scenes: [] },
    posterElements: { mainHeadline: "测试", subHeadline: "", bodyText: "", callToAction: "" },
    posterUrl: null,
    videoUrl: null,
    platformContents: null,
    createdAt: new Date()
  }),
  updateGenerationHistory: vi.fn().mockResolvedValue(undefined),
  deleteGenerationHistory: vi.fn().mockResolvedValue(undefined),
  createBrandAsset: vi.fn().mockResolvedValue(1),
  getBrandAssetsByUserId: vi.fn().mockResolvedValue([]),
  getBrandAssetById: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    name: "测试Logo",
    type: "logo",
    url: "https://example.com/logo.png",
    value: null,
    description: "测试描述",
    createdAt: new Date(),
    updatedAt: new Date()
  }),
  updateBrandAsset: vi.fn().mockResolvedValue(undefined),
  deleteBrandAsset: vi.fn().mockResolvedValue(undefined),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getDb: vi.fn()
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("generate.content", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates marketing content successfully for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.generate.content({
      prompt: "为XX高新科技产业园撰写招商推文",
      style: "专业稳重",
    });

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("prospectus");
    expect(result).toHaveProperty("videoScript");
    expect(result).toHaveProperty("posterElements");
    expect(result.prospectus.title).toBe("测试招商文案标题");
    expect(result.videoScript.scenes).toHaveLength(1);
  });

  it("throws error for unauthenticated user", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.generate.content({
        prompt: "测试提示词",
        style: "专业稳重",
      })
    ).rejects.toThrow();
  });
});

describe("history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists generation history for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.history.list({ limit: 20 });

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("prompt", "测试提示词");
  });

  it("gets single history record", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.history.get({ id: 1 });

    expect(result).toHaveProperty("id", 1);
    expect(result).toHaveProperty("prompt", "测试提示词");
  });

  it("deletes history record", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.history.delete({ id: 1 });

    expect(result).toEqual({ success: true });
  });
});

describe("assets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a color asset", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.assets.create({
      name: "品牌主色",
      type: "color",
      value: "#3B82F6",
      description: "品牌主要颜色",
    });

    expect(result).toHaveProperty("id", 1);
  });

  it("lists brand assets", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.assets.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("deletes brand asset", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.assets.delete({ id: 1 });

    expect(result).toEqual({ success: true });
  });
});
