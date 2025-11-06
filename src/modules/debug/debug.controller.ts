import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller('debug')
export class DebugController {
  @Get('tenant')
  getTenant(@Req() req: Request & { tenant?: string }) {
    return {
      message: 'TenantContextMiddleware test',
      tenant: req.tenant || null,
    };
  }
}
