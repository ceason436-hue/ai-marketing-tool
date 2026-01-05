import { createBaseApp } from "../server/_core/app-base";

// Cache the app instance
let app: any;

export default async function handler(req: any, res: any) {
  if (!app) {
    const { app: expressApp } = await createBaseApp();
    app = expressApp;
  }
  
  app(req, res);
}
