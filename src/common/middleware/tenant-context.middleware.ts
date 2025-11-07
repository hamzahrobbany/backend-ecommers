import {
  Injectable,
  NestMiddleware,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { verify, JwtPayload } from 'jsonwebtoken';
import { TenantsService } from '../../modules/tenants/tenants.service';
import { Tenant } from '../../modules/tenants/entities/tenant.entity'; // ✅ pastikan path entity benar

/**
 * 🏢 TenantContextMiddleware
 * -------------------------------------------
 * - Baca tenant dari header `X-Tenant-ID` atau dari JWT.
 * - Validasi tenant lewat TenantsService.
 * - Simpan hasilnya ke req.tenant agar bisa diakses controller/service mana pun.
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantContextMiddleware.name);

  constructor(private readonly tenantsService: TenantsService) {}

  async use(
    req: Request & { tenant?: Tenant | null },
    res: Response,
    next: NextFunction,
  ) {
    try {
      const headerTenant = req.headers['x-tenant-id'] as string | undefined;
      const authHeader = req.headers['authorization'];
      let tokenTenant: string | undefined;

      // 🔐 Ambil tenantId dari JWT
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const decoded = verify(
            token,
            process.env.JWT_SECRET || 'default_secret',
          ) as JwtPayload & { tenantId?: string; tenant_id?: string };

          tokenTenant = decoded?.tenantId || decoded?.tenant_id;
        } catch (err: any) {
          this.logger.warn(`Invalid JWT: ${err?.message || err}`);
        }
      }

      // 🧩 Tentukan tenant dari header > token
      const tenantIdentifier = headerTenant || tokenTenant;

      if (!tenantIdentifier) {
        this.logger.verbose('TenantContext: no tenant identifier found');
        return next(); // lanjut tanpa tenant (misal untuk route public)
      }

      // ✅ Cek tenant lewat service
      let tenant: Tenant | null = null;

      try {
        // bisa id UUID atau domain (misalnya "salwa")
        if (tenantIdentifier.includes('-')) {
          tenant = await this.tenantsService.findById(tenantIdentifier);
        } else {
          tenant = await this.tenantsService.findByDomain(tenantIdentifier);
        }

        if (!tenant) {
          throw new NotFoundException(`Tenant tidak ditemukan: ${tenantIdentifier}`);
        }
      } catch (err) {
        throw new NotFoundException(`Tenant tidak ditemukan: ${tenantIdentifier}`);
      }

      // 🚀 Inject tenant ke request
      (req as any).tenant = tenant;

      this.logger.debug(
        `TenantContext resolved: ${tenant?.name ?? 'unknown'} (${tenant?.id ?? 'N/A'})`,
      );

      next();
    } catch (error: any) {
      this.logger.error(`TenantContext error: ${error?.message || error}`);
      next();
    }
  }
}
