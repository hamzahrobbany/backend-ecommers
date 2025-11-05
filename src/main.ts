import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import {
  ExpressAdapter,
  NestExpressApplication,
} from '@nestjs/platform-express';

// Fastify plugins
import fastifyHelmet from '@fastify/helmet';
import fastifyCompress from '@fastify/compress';
import fastifyCors from '@fastify/cors';

// Express middlewares
import expressHelmet from 'helmet';
import expressCompression from 'compression';
import expressCors from 'cors';

let cachedApp: NestFastifyApplication | NestExpressApplication;

/**
 * Bootstraps NestJS server.
 * Automatically uses:
 * - 🚀 Fastify for local development
 * - ☁️ Express for Vercel / serverless
 */
export async function bootstrapServer(): Promise<
  NestFastifyApplication | NestExpressApplication
> {
  if (cachedApp) return cachedApp;

  const isServerless =
    process.env.VERCEL === '1' || process.env.SERVERLESS === 'true';

  if (isServerless) {
    // ✅ EXPRESS for Vercel (serverless)
    const expressApp = await NestFactory.create<NestExpressApplication>(
      AppModule,
      new ExpressAdapter(),
    );

    const nativeExpress = expressApp.getHttpAdapter().getInstance();
    nativeExpress.use(expressCors());
    nativeExpress.use(expressCompression());
    nativeExpress.use(
      expressHelmet({
        contentSecurityPolicy: false,
      }),
    );

    expressApp.setGlobalPrefix('api');
    await expressApp.init();
    cachedApp = expressApp;
    return expressApp;
  }

  // 🚀 FASTIFY for local dev
  const fastifyApp = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  await fastifyApp.register(fastifyHelmet, { contentSecurityPolicy: false });
  await fastifyApp.register(fastifyCompress);
  await fastifyApp.register(fastifyCors, { origin: true });

  fastifyApp.setGlobalPrefix('api');
  await fastifyApp.init();
  cachedApp = fastifyApp;
  return fastifyApp;
}

// ✅ Local development only
if (process.env.NODE_ENV !== 'production') {
  bootstrapServer()
    .then((app) =>
      (app as NestFastifyApplication).listen(3000, '0.0.0.0', () => {
        console.log(`✅ Local server running at http://localhost:3000/api`);
      }),
    )
    .catch((err) => {
      console.error('❌ Failed to start local server:', err);
    });
}
