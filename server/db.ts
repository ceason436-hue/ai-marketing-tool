import { InsertUser, User, InsertGenerationHistory, GenerationHistory, InsertBrandAsset, BrandAsset } from "../drizzle/schema";
import { ENV } from './_core/env';

// In-memory mock database
const mockDb = {
  users: [] as User[],
  generationHistory: [] as GenerationHistory[],
  brandAssets: [] as BrandAsset[],
  ids: {
    users: 1,
    generationHistory: 1,
    brandAssets: 1
  }
};

export async function getDb() {
  return mockDb;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  let existingUser = mockDb.users.find(u => u.openId === user.openId);
  const now = new Date();

  if (existingUser) {
    // Update existing user
    if (user.name !== undefined) existingUser.name = user.name;
    if (user.email !== undefined) existingUser.email = user.email;
    if (user.loginMethod !== undefined) existingUser.loginMethod = user.loginMethod;
    if (user.lastSignedIn !== undefined) existingUser.lastSignedIn = user.lastSignedIn;
    if (user.role !== undefined) existingUser.role = user.role;
    
    existingUser.updatedAt = now;
    if (!user.lastSignedIn) existingUser.lastSignedIn = now;
  } else {
    // Create new user
    const newUser: User = {
      id: mockDb.ids.users++,
      openId: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      loginMethod: user.loginMethod ?? null,
      role: user.role ?? (user.openId === ENV.ownerOpenId ? 'admin' : 'user'),
      createdAt: now,
      updatedAt: now,
      lastSignedIn: user.lastSignedIn ?? now,
    };
    mockDb.users.push(newUser);
  }
}

export async function getUserByOpenId(openId: string) {
  return mockDb.users.find(u => u.openId === openId);
}

// ============ Generation History Functions ============

export async function createGenerationHistory(data: InsertGenerationHistory): Promise<number> {
  const id = mockDb.ids.generationHistory++;
  const newHistory: GenerationHistory = {
    id,
    userId: data.userId,
    prompt: data.prompt,
    style: data.style,
    prospectusContent: data.prospectusContent ?? null,
    videoScriptContent: data.videoScriptContent ?? null,
    posterElements: data.posterElements ?? null,
    posterUrl: data.posterUrl ?? null,
    videoUrl: data.videoUrl ?? null,
    platformContents: data.platformContents ?? null,
    createdAt: new Date(),
  };
  mockDb.generationHistory.push(newHistory);
  return id;
}

export async function getGenerationHistoryByUserId(userId: number, limit = 20): Promise<GenerationHistory[]> {
  return mockDb.generationHistory
    .filter(h => h.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

export async function getGenerationHistoryById(id: number): Promise<GenerationHistory | undefined> {
  return mockDb.generationHistory.find(h => h.id === id);
}

export async function updateGenerationHistory(id: number, data: Partial<InsertGenerationHistory>): Promise<void> {
  const history = mockDb.generationHistory.find(h => h.id === id);
  if (history) {
    Object.assign(history, data);
  }
}

export async function deleteGenerationHistory(id: number): Promise<void> {
  const index = mockDb.generationHistory.findIndex(h => h.id === id);
  if (index !== -1) {
    mockDb.generationHistory.splice(index, 1);
  }
}

// ============ Brand Assets Functions ============

export async function createBrandAsset(data: InsertBrandAsset): Promise<number> {
  const id = mockDb.ids.brandAssets++;
  const newAsset: BrandAsset = {
    id,
    userId: data.userId,
    name: data.name,
    type: data.type,
    url: data.url ?? null,
    value: data.value ?? null,
    description: data.description ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mockDb.brandAssets.push(newAsset);
  return id;
}

export async function getBrandAssetsByUserId(userId: number): Promise<BrandAsset[]> {
  return mockDb.brandAssets
    .filter(a => a.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getBrandAssetById(id: number): Promise<BrandAsset | undefined> {
  return mockDb.brandAssets.find(a => a.id === id);
}

export async function updateBrandAsset(id: number, data: Partial<InsertBrandAsset>): Promise<void> {
  const asset = mockDb.brandAssets.find(a => a.id === id);
  if (asset) {
    Object.assign(asset, data);
    asset.updatedAt = new Date();
  }
}

export async function deleteBrandAsset(id: number): Promise<void> {
  const index = mockDb.brandAssets.findIndex(a => a.id === id);
  if (index !== -1) {
    mockDb.brandAssets.splice(index, 1);
  }
}
