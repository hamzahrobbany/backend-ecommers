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
import { Logger, RequestMethod } from '@nestjs/common';
import {
  SwaggerModule,
  DocumentBuilder,
  SwaggerCustomOptions,
} from '@nestjs/swagger';

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

// 📘 Swagger Plugins
import {
  swaggerAuthPlugin,
  swaggerRequestInterceptor,
  swaggerAuthStorageInstructions,
} from './common/swagger/swagger-auth.plugin';

let cachedApp: NestFastifyApplication | NestExpressApplication;

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

    // 🧩 Apply TenantContextMiddleware but exclude public routes
    expressApp.use((req, res, next) => {
      const url = req.url.toLowerCase();
      const method = req.method.toUpperCase();

      const isPublic =
        url.startsWith('/api/docs') ||
        url.startsWith('/api-json') ||
        url.startsWith('/swagger-ui') ||
        url.startsWith('/favicon') ||
        url.startsWith('/auth/login') ||
        url.startsWith('/auth/register') ||
        url.startsWith('/tenants');

      if (isPublic) return next();

      const tenantContext = expressApp.get(TenantContextMiddleware);
      (tenantContext as any).use(req as any, res, next);
    });

    // 📘 Swagger hanya aktif di development
    if (process.env.NODE_ENV !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('E-Commerce API')
        .setDescription('Dokumentasi REST API Backend E-Commerce (Express Mode)')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

      const document = SwaggerModule.createDocument(expressApp, config);
      const swaggerOptions: SwaggerCustomOptions = {
        swaggerOptions: {
          persistAuthorization: true,
          plugins: [swaggerAuthPlugin()],
          requestInterceptor: swaggerRequestInterceptor,
        },
        customJs: `
          console.log('%c🚀 Swagger Auto Auth Enabled', 'color: #4CAF50; font-weight: bold;');
          console.log(\`${swaggerAuthStorageInstructions}\`);
        `,
      };

      SwaggerModule.setup('api/docs', expressApp, document, swaggerOptions);
      Logger.log(`\n${swaggerAuthStorageInstructions}`, 'Swagger');
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

  await fastifyApp.register(fastifyHelmet, {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  });
  await fastifyApp.register(fastifyCompress);
  await fastifyApp.register(fastifyCors, { origin: true });

  fastifyApp.setGlobalPrefix('api');

  // 🧩 TenantContextMiddleware (Fastify) — exclude public routes
  const tenantContext = fastifyApp.get(TenantContextMiddleware);
  fastifyApp.use((req, res, next) => {
    const url = req.url.toLowerCase();
    const method = req.method.toUpperCase();

    const isPublic =
      url.startsWith('/api/docs') ||
      url.startsWith('/api-json') ||
      url.startsWith('/swagger-ui') ||
      url.startsWith('/favicon') ||
      url.startsWith('/auth/login') ||
      url.startsWith('/auth/register') ||
      url.startsWith('/tenants');

    if (isPublic) return next();

    (tenantContext as any).use(req as any, res, next);
  });

  // 📘 Swagger
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('E-Commerce API')
      .setDescription('Dokumentasi REST API Backend E-Commerce (Fastify Mode)')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(fastifyApp, config);
    const swaggerOptions: SwaggerCustomOptions = {
      swaggerOptions: {
        persistAuthorization: true,
        plugins: [swaggerAuthPlugin()],
        requestInterceptor: swaggerRequestInterceptor,
      },
      customJs: `
        console.log('%c🚀 Swagger Auto Auth Enabled', 'color: #4CAF50; font-weight: bold;');
        console.log(\`${swaggerAuthStorageInstructions}\`);
      `,
    };

    SwaggerModule.setup('api/docs', fastifyApp, document, swaggerOptions);
    Logger.log(`\n${swaggerAuthStorageInstructions}`, 'Swagger');
  }

  cachedApp = fastifyApp;
  return fastifyApp;
}

/**
 * 🧩 Local Development Entry Point (Fastify)
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
