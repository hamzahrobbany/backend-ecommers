import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { verify, JwtPayload } from 'jsonwebtoken';

/**
 * Middleware untuk menetapkan tenant_id dari header atau token JWT.
 * Hasilnya disimpan di req.tenant agar bisa diakses oleh guard, service, dsb.
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantContextMiddleware.name);

  use(req: Request & { tenant?: string }, res: Response, next: NextFunction) {
    try {
      // Ambil tenant dari header `x-tenant-id`
      const headerTenant = req.headers['x-tenant-id'] as string | undefined;

      // Ambil tenant dari JWT token (Authorization: Bearer <token>)
      let tokenTenant: string | undefined;
      const authHeader = req.headers['authorization'];

      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];

        try {
          const decoded = verify(
            token,
            process.env.JWT_SECRET || 'default_secret'
          ) as JwtPayload & { tenant_id?: string; tenantId?: string };

          tokenTenant = decoded?.tenant_id || decoded?.tenantId;
        } catch (err) {
          this.logger.warn(`Invalid JWT: ${err.message}`);
        }
      }

      // Tentukan tenant akhir yang digunakan
      const tenant = headerTenant || tokenTenant;

      if (tenant) {
        req.tenant = tenant;
        this.logger.debug(`TenantContext resolved: ${tenant}`);
      } else {
        this.logger.verbose('TenantContextMiddleware: tenant not found');
      }

      next();
    } catch (error) {
      this.logger.error(`TenantContextMiddleware error: ${error.message}`);
      next();
    }
  }
}
