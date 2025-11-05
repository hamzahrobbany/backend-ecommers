import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import cors from '@fastify/cors';

let cachedApp: NestFastifyApplication;

/**
 * Bootstrap server for both local & Vercel environments
 */
export async function bootstrapServer(): Promise<NestFastifyApplication> {
  if (cachedApp) return cachedApp;

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(compress);
  await app.register(cors, { origin: true });

  // optional: add global prefix for your API
  app.setGlobalPrefix('api');

  // add root and healthz route (avoid Fastify undefined error)
  const instance = app.getHttpAdapter().getInstance();
  instance.get('/', async (_req, reply) => {
    reply.send({ ok: true, service: 'backend-ecommers', time: new Date().toISOString() });
  });
  instance.get('/healthz', async (_req, reply) => {
    reply.send({ status: 'ok' });
  });

  await app.init();
  cachedApp = app;
  return app;
}

// Run local server (Vercel will skip this section)
if (process.env.NODE_ENV !== 'production') {
  bootstrapServer().then((app) => app.listen(3000, '0.0.0.0'));
}
