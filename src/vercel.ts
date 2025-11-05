import { bootstrapServer } from './main';

/**
 * Vercel serverless entry point.
 * Uses Express adapter from bootstrapServer().
 */
export default async function handler(req: any, res: any) {
  try {
    const app = await bootstrapServer();
    const instance = app.getHttpAdapter().getInstance();

    // ✅ Handle Express request directly (no .server.emit for Fastify)
    return instance(req, res);
  } catch (err) {
    console.error('❌ Vercel function crashed:', err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
}
