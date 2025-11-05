import { Controller, Get } from '@nestjs/common';

@Controller('api')
export class AppController {
  @Get('info')
  getInfo() {
    return {
      ok: true,
      name: 'Backend E-Commerce',
      framework: 'NestJS + Fastify',
      platform: 'Vercel Serverless',
      time: new Date().toISOString(),
    };
  }
}
