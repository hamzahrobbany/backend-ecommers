import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantsService } from '../../modules/tenants/tenants.service';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly tenantsService: TenantsService) {}

  async use(req: Request & { tenantId?: string; user?: any }, res: Response, next: NextFunction) {
    // 🟢 1. Ambil dari JWT (paling aman)
    if (req.user && req.user.tenantId) {
      req.tenantId = req.user.tenantId;
      return next();
    }

    // 🟢 2. Ambil dari subdomain, misal salwa.localhost:3000
    const host = req.hostname || '';
    const subdomain = host.split('.')[0];
    if (subdomain && subdomain !== 'localhost') {
      const tenant = await this.tenantsService.findByDomain(subdomain);
      if (tenant) {
        req.tenantId = tenant.id;
        return next();
      }
    }

    // 🟡 3. Fallback: (sementara) masih bisa header, tapi validasi
    const headerTenant = req.headers['x-tenant-id'] as string;
    if (headerTenant) {
      const tenant = await this.tenantsService.findById(headerTenant);
      if (tenant) {
        req.tenantId = tenant.id;
        return next();
      }
    }

    throw new UnauthorizedException('Tenant context tidak ditemukan.');
  }
}
