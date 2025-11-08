import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
<<<<<<< ours
import { Request, Response, NextFunction } from 'express';
import { TenantsService } from '../../modules/tenants/tenants.service';
=======
import type { Request, Response, NextFunction } from 'express';
import { verify, type JwtPayload } from 'jsonwebtoken';
import { TenantsService } from '../../modules/tenants/tenants.service';
import type { Tenant } from '../../modules/tenants/entities/tenant.entity';

interface TenantAwareRequest extends Request {
  user?: Record<string, any> | undefined;
  tenant?: Tenant | null;
  tenantId?: string | null;
}

interface TenantJwtPayload extends JwtPayload {
  tenantId?: string;
  tenant_id?: string;
}
>>>>>>> theirs

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly tenantsService: TenantsService) {}

<<<<<<< ours
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
=======
  async use(req: TenantAwareRequest, res: Response, next: NextFunction) {
    try {
      const tenantIdentifier =
        this.getTenantIdFromUser(req) ??
        this.getTenantIdFromAuthorization(req) ??
        this.getTenantDomainFromHost(req);

      if (!tenantIdentifier) {
        req.tenant = null;
        req.tenantId = null;
        return next();
      }

      const tenant = await this.resolveTenant(tenantIdentifier);

      req.tenant = tenant;
      req.tenantId = tenant.id;

      if (req.user && !req.user['tenantId']) {
        req.user['tenantId'] = tenant.id;
>>>>>>> theirs
      }
    }

<<<<<<< ours
    // 🟡 3. Fallback: (sementara) masih bisa header, tapi validasi
    const headerTenant = req.headers['x-tenant-id'] as string;
    if (headerTenant) {
      const tenant = await this.tenantsService.findById(headerTenant);
      if (tenant) {
        req.tenantId = tenant.id;
        return next();
      }
=======
      this.logger.debug(
        `TenantContext resolved: ${tenant.name ?? tenant.id} (${tenant.id})`,
      );

      return next();
    } catch (error) {
      this.logger.error(`TenantContext error: ${(error as Error).message}`);
      return next(error);
    }
  }

  private getTenantIdFromUser(req: TenantAwareRequest): string | null {
    const userTenantId = req.user?.['tenantId'] ?? req.user?.['tenant_id'];
    return typeof userTenantId === 'string' && userTenantId.trim().length > 0
      ? userTenantId
      : null;
  }

  private getTenantIdFromAuthorization(req: Request): string | null {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return null;
    }

    const secret =
      process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET ?? null;

    if (!secret) {
      this.logger.warn('JWT secret is not configured; skip tenant resolution');
      return null;
    }

    try {
      const decoded = verify(token, secret) as TenantJwtPayload;
      const tenantId = decoded.tenantId ?? decoded.tenant_id ?? null;
      return typeof tenantId === 'string' && tenantId.trim().length > 0
        ? tenantId
        : null;
    } catch (error) {
      this.logger.warn(`Unable to decode JWT for tenant context: ${error}`);
      return null;
    }
  }

  private getTenantDomainFromHost(req: Request): string | null {
    const forwardedHost =
      (req.headers['x-forwarded-host'] as string | undefined) ?? undefined;
    const hostHeader = forwardedHost ?? req.headers.host ?? req.hostname;
    if (!hostHeader) {
      return null;
    }

    const host = hostHeader.split(':')[0].toLowerCase();
    if (!host || this.isIpAddress(host)) {
      return null;
    }

    const baseDomain = process.env.MULTITENANT_BASE_DOMAIN?.toLowerCase();
    if (baseDomain && baseDomain.length > 0) {
      if (host === baseDomain) {
        return null;
      }

      if (host.endsWith(`.${baseDomain}`)) {
        const withoutBase = host.slice(0, -1 * (baseDomain.length + 1));
        const parts = withoutBase.split('.').filter(Boolean);
        const candidate = parts[parts.length - 1];
        if (candidate && candidate !== 'www') {
          return candidate;
        }
      }
      return null;
    }

    const segments = host.split('.').filter(Boolean);
    if (segments.length < 2) {
      return null;
    }

    const subdomain = segments[0];
    return subdomain && subdomain !== 'www' ? subdomain : null;
  }

  private async resolveTenant(identifier: string): Promise<Tenant> {
    const normalized = identifier.trim().toLowerCase();
    if (!normalized) {
      throw new NotFoundException('Tenant tidak ditemukan');
    }

    const tenantById = await this.tryResolve(() =>
      this.tenantsService.findById(normalized),
    );
    if (tenantById) {
      return tenantById;
    }

    const tenantByDomain = await this.tryResolve(() =>
      this.tenantsService.findByDomain(normalized),
    );
    if (tenantByDomain) {
      return tenantByDomain;
    }

    throw new NotFoundException(
      `Tenant tidak ditemukan untuk identifier "${identifier}"`,
    );
  }

  private async tryResolve(
    resolver: () => Promise<Tenant>,
  ): Promise<Tenant | null> {
    try {
      return await resolver();
    } catch (error) {
      return null;
>>>>>>> theirs
    }

    throw new UnauthorizedException('Tenant context tidak ditemukan.');
  }

  private isIpAddress(host: string): boolean {
    const ipv4 = /^\d{1,3}(?:\.\d{1,3}){3}$/;
    const ipv6 = /:/;
    return ipv4.test(host) || ipv6.test(host);
  }
}
