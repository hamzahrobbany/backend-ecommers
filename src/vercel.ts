import { bootstrapServer } from './main';

/**
 * Entry point for Vercel Serverless Functions
 */
export default async function handler(req: any, res: any) {
  const app = await bootstrapServer();
  const instance = app.getHttpAdapter().getInstance();
  instance.server.emit('request', req, res);
}
