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
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

// 🧩 Middleware
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';


// 🌐 Fastify plugins
import fastifyHelmet from '@fastify/helmet';
import fastifyCompress from '@fastify/compress';
import fastifyCors from '@fastify/cors';

// 🌐 Express middlewares
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';

let cachedApp: NestFastifyApplication | NestExpressApplication;

/**
 * 🚀 Bootstraps NestJS server.
 * - Fastify: untuk local dev
 * - Express: untuk serverless (Vercel)
 */
export async function bootstrapServer(): Promise<
  NestFastifyApplication | NestExpressApplication
> {
  if (cachedApp) return cachedApp;

  const isServerless =
    process.env.VERCEL === '1' ||
    process.env.VERCEL === 'true' ||
    process.env.SERVERLESS === 'true';

  // ======================================================
  // ☁️ EXPRESS MODE (Vercel / Serverless)
  // ======================================================
  if (isServerless) {
    const expressApp = await NestFactory.create<NestExpressApplication>(
      AppModule,
      new ExpressAdapter(),
    );

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

    // 🧩 Aktifkan TenantContextMiddleware (Express)
    const tenantContext = expressApp.get(TenantContextMiddleware);
    nativeExpress.use((req, res, next) => tenantContext.use(req, res, next));

    // 📘 Swagger hanya aktif di dev
    if (process.env.NODE_ENV !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('E-Commerce API')
        .setDescription('Dokumentasi REST API Backend E-Commerce (Express Mode)')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

      const document = SwaggerModule.createDocument(expressApp, config);
      SwaggerModule.setup('api/docs', expressApp, document, {
        swaggerOptions: { persistAuthorization: true },
      });
    }

    await expressApp.init();
    cachedApp = expressApp;
    return expressApp;
  }

  // ======================================================
  // 🚀 FASTIFY MODE (Local Development)
  // ======================================================
  const fastifyApp = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // 🌐 Fastify plugins
  await fastifyApp.register(fastifyHelmet, {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  });
  await fastifyApp.register(fastifyCompress);
  await fastifyApp.register(fastifyCors, { origin: true });

  fastifyApp.setGlobalPrefix('api');

  // 🧩 Aktifkan TenantContextMiddleware (Fastify)
  const tenantContext = fastifyApp.get(TenantContextMiddleware);
  fastifyApp.use((req, res, next) => tenantContext.use(req, res, next));

  // 📘 Swagger
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('E-Commerce API')
      .setDescription('Dokumentasi REST API Backend E-Commerce (Fastify Mode)')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(fastifyApp, config);
    SwaggerModule.setup('api/docs', fastifyApp, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  cachedApp = fastifyApp;
  return fastifyApp;
}

/**
 * 🧩 Local development bootstrap (Fastify)
 */
if (process.env.NODE_ENV !== 'production') {
  const logger = new Logger('Bootstrap');

  bootstrapServer()
    .then(async (app) => {
      const fastifyApp = app as NestFastifyApplication;
      const instance = fastifyApp.getHttpAdapter().getInstance();

      await app.init();
      await instance.ready();
      await instance.listen({ port: 3000, host: '0.0.0.0' });

      logger.log('✅ Local server running at http://localhost:3000/api');
      logger.log('📘 Swagger Docs: http://localhost:3000/api/docs');
      console.log('\n🛣️  Registered Routes:\n');
      console.log(instance.printRoutes());
      console.log('---------------------------------------------');
    })
    .catch((err) => {
      console.error('❌ Failed to start local server:', err);
      process.exit(1);
    });
}
