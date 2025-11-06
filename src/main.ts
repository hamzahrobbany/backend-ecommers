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
import { Logger } from '@nestjs/common';

// Fastify plugins
import fastifyHelmet from '@fastify/helmet';
import fastifyCompress from '@fastify/compress';
import fastifyCors from '@fastify/cors';

// Express middlewares
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';

let cachedApp: NestFastifyApplication | NestExpressApplication;

/**
 * 🚀 Bootstraps NestJS server.
 * - Fastify: local development
 * - Express: Vercel / serverless
 */
export async function bootstrapServer(): Promise<
  NestFastifyApplication | NestExpressApplication
> {
  if (cachedApp) return cachedApp;

  const isServerless =
    process.env.VERCEL === '1' ||
    process.env.VERCEL === 'true' ||
    process.env.SERVERLESS === 'true';

  if (isServerless) {
    // ☁️ EXPRESS for Vercel
    const expressApp = await NestFactory.create<NestExpressApplication>(
      AppModule,
      new ExpressAdapter(),
    );

    // Setup middleware
    const nativeExpress = expressApp.getHttpAdapter().getInstance();
    nativeExpress.use(cors());
    nativeExpress.use(compression());
    nativeExpress.use(
      helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
      }),
    );

    expressApp.setGlobalPrefix('api');
    await expressApp.init();
    cachedApp = expressApp;
    return expressApp;
  }

  // 🚀 FASTIFY for local development
  const fastifyApp = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  await fastifyApp.register(fastifyHelmet, {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  });
  await fastifyApp.register(fastifyCompress);
  await fastifyApp.register(fastifyCors, { origin: true });

  fastifyApp.setGlobalPrefix('api');
  cachedApp = fastifyApp;
  return fastifyApp;
}

/**
 * 🧩 Local development bootstrap
 */
if (process.env.NODE_ENV !== 'production') {
  const logger = new Logger('Bootstrap');

  bootstrapServer()
    .then(async (app) => {
      // Jalankan hanya jika Fastify
      const fastifyApp = app as NestFastifyApplication;
      const instance = fastifyApp.getHttpAdapter().getInstance();

      await instance.ready();
      await instance.listen({ port: 3000, host: '0.0.0.0' });

      logger.log('✅ Local server running at http://localhost:3000/api');

      // 🛣️ Cetak daftar route
      console.log('\n🛣️  Registered Routes:\n');
      console.log(instance.printRoutes());
      console.log('---------------------------------------------');
    })
    .catch((err) => {
      console.error('❌ Failed to start local server:', err);
      process.exit(1);
    });
}
