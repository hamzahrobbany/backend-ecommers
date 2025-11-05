import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import cors from '@fastify/cors';

let cachedApp: NestFastifyApplication;

export async function bootstrapServer(): Promise<NestFastifyApplication> {
  if (cachedApp) return cachedApp;

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(compress);
  await app.register(cors, { origin: true });

  app.setGlobalPrefix('api');

  await app.init();
  cachedApp = app;
  return app;
}

if (process.env.NODE_ENV !== 'production') {
  bootstrapServer().then((app) => app.listen(3000, '0.0.0.0'));
}
