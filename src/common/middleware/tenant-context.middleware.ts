import { Injectable, NestMiddleware, NotFoundException, Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { verify, type JwtPayload } from 'jsonwebtoken';
import { TenantsService } from '../../modules/tenants/tenants.service';
import type { Tenant } from '../../modules/tenants/entities/tenant.entity';

interface TenantAwareRequest extends Request {
  user?: Record<string, any>;
  tenant?: Tenant | null;
  tenantId?: string | null;
}

interface TenantJwtPayload extends JwtPayload {
  tenantId?: string;
  tenant_id?: string;
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantContextMiddleware.name);

  constructor(private readonly tenantsService: TenantsService) {}

  async use(req: TenantAwareRequest, res: Response, next: NextFunction) {
    req.tenant = req.tenant ?? null;
    req.tenantId = req.tenantId ?? null;

    try {
      const tenantIdentifier =
        this.getTenantIdFromUser(req) ??
        this.getTenantIdFromAccessToken(req) ??
        this.getTenantDomainFromHost(req);

      if (!tenantIdentifier) {
        return next();
      }

      const tenant = await this.resolveTenant(tenantIdentifier);
      req.tenant = tenant;
      req.tenantId = tenant.id;

      if (req.user) {
        req.user['tenantId'] = tenant.id;
      }

      this.logger.debug(
        `TenantContext resolved: ${tenant.name ?? tenant.id} (${tenant.id})`,
      );
      return next();
    } catch (error) {
      this.logger.error(
        `TenantContext error: ${(error as Error).message}`,
        (error as Error).stack,
      );
      return next(error);
    }
  }

  private getTenantIdFromUser(req: TenantAwareRequest): string | null {
    const id = req.user?.['tenantId'] ?? req.user?.['tenant_id'];
    return this.normalizeIdentifier(id);
  }

  private getTenantIdFromAccessToken(req: Request): string | null {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) return null;

    const token = authHeader.split(' ')[1];
    if (!token) return null;

    const secret =
      process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET ?? null;

    if (!secret) {
      this.logger.warn('JWT secret tidak dikonfigurasi');
      return null;
    }

    try {
      const decoded = verify(token, secret) as TenantJwtPayload;
      const tenantId = decoded.tenantId ?? decoded.tenant_id ?? null;
      return this.normalizeIdentifier(tenantId);
    } catch (error) {
      this.logger.warn(
        `Gagal memverifikasi JWT untuk tenant: ${(error as Error).message}`,
      );
      return null;
    }
  }

  private getTenantDomainFromHost(req: Request): string | null {
    const forwardedHost = req.headers['x-forwarded-host'] as string | undefined;
    const hostHeader = forwardedHost ?? req.headers.host ?? req.hostname;
    if (!hostHeader) return null;

    const host = hostHeader.split(':')[0].toLowerCase();
    if (this.isIpAddress(host)) return null;

    const baseDomain = process.env.MULTITENANT_BASE_DOMAIN?.toLowerCase();
    if (baseDomain && baseDomain.length > 0) {
      if (host === baseDomain) return null;
      if (host.endsWith(`.${baseDomain}`)) {
        const sub = host.replace(`.${baseDomain}`, '');
        const parts = sub.split('.').filter(Boolean);
        const candidate = parts[parts.length - 1];
        return candidate && candidate !== 'www' ? candidate : null;
      }
      return null;
    }

    const segments = host.split('.').filter(Boolean);
    if (segments.length < 2) return null;

    const subdomain = segments[0];
    return subdomain !== 'www' ? subdomain : null;
  }

  private async resolveTenant(identifier: string): Promise<Tenant> {
    const normalized = identifier.trim().toLowerCase();
    if (!normalized) throw new NotFoundException('Tenant tidak ditemukan');

    const tenantById = await this.tryResolve(() =>
      this.tenantsService.findById(normalized),
    );
    if (tenantById) return tenantById;

    const tenantByDomain = await this.tryResolve(() =>
      this.tenantsService.findByDomain(normalized),
    );
    if (tenantByDomain) return tenantByDomain;

    throw new NotFoundException(
      `Tenant tidak ditemukan untuk identifier "${identifier}"`,
    );
  }

  private async tryResolve(
    resolver: () => Promise<Tenant>,
  ): Promise<Tenant | null> {
    try {
      return await resolver();
    } catch {
      return null;
    }
  }

  private isIpAddress(host: string): boolean {
    const ipv4 = /^\d{1,3}(?:\.\d{1,3}){3}$/;
    const ipv6 = /:/;
    return ipv4.test(host) || ipv6.test(host);
  }

  private normalizeIdentifier(value?: string | null): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
}
