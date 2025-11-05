import { Controller, Get } from '@nestjs/common';

@Controller() // jangan tambahkan 'api' karena sudah di main.ts
export class AppController {
  @Get('info')
  getInfo() {
    return {
      ok: true,
      name: 'Backend E-Commerce',
      framework: 'NestJS + Fastify',
      platform: process.env.VERCEL ? 'Vercel Serverless' : 'Local Development',
      time: new Date().toISOString(),
    };
  }

  @Get()
  getRoot() {
    return {
      ok: true,
      message: 'Welcome to Backend E-Commerce API 🚀',
      docs: '/api/info',
    };
  }

  @Get('healthz')
  getHealth() {
    return { status: 'ok', uptime: process.uptime() };
  }
}
