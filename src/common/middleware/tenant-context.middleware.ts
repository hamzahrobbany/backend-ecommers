import {
  Injectable,
  NestMiddleware,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
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
    const url = req.url ?? '';

    // ✅ 1️⃣ Abaikan permintaan non-API publik (Swagger, favicon, file statis)
    if (
      url.startsWith('/api/docs') ||
      url.startsWith('/api-json') ||
      url.includes('swagger-ui') ||
      url.startsWith('/favicon') ||
      url.includes('.js') ||
      url.includes('.css') ||
      url.includes('.map')
    ) {
      return next();
    }

    req.tenant = req.tenant ?? null;
    req.tenantId = req.tenantId ?? null;

    try {
      // ✅ 2️⃣ Ambil identifier tenant (Header > JWT > Subdomain)
      const tenantIdentifier =
        this.getTenantIdFromHeader(req) ??
        this.normalizeIdentifier(
          (req.user?.tenantId as string | undefined) ?? null,
        ) ??
        this.getTenantIdFromAccessToken(req) ??
        this.getTenantDomainFromHost(req);

      if (!tenantIdentifier) {
        if (this.isTenantOptional(req)) {
          return next();
        }

        throw new BadRequestException('Tenant context tidak ditemukan');
      }

      // ✅ 4️⃣ Resolve tenant dari DB
      const tenant = await this.resolveTenant(tenantIdentifier);
      req.tenant = tenant;
      req.tenantId = tenant.id;
      if (req.user) req.user['tenantId'] = tenant.id;

      this.logger.debug(
        `🏷️ TenantContext resolved: ${tenant.name ?? tenant.id} (${tenant.id})`,
      );
      next();
    } catch (error) {
      this.logger.error(
        `TenantContext error: ${(error as Error).message}`,
        (error as Error).stack,
      );
      next(error);
    }
  }

  private getTenantIdFromHeader(req: TenantAwareRequest): string | null {
    const header =
      req.headers['x-tenant-id'] ??
      req.headers['X-Tenant-ID'] ??
      req.headers['x-tenant'] ??
      req.headers['tenant'];
    return this.normalizeIdentifier(header as string);
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
      return this.normalizeIdentifier(decoded.tenantId ?? decoded.tenant_id);
    } catch (error) {
      this.logger.warn(
        `Gagal memverifikasi JWT: ${(error as Error).message}`,
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
    if (baseDomain && host.endsWith(`.${baseDomain}`)) {
      const sub = host.replace(`.${baseDomain}`, '');
      const parts = sub.split('.').filter(Boolean);
      return parts[parts.length - 1] !== 'www' ? parts[parts.length - 1] : null;
    }

    const segments = host.split('.').filter(Boolean);
    return segments.length > 2 && segments[0] !== 'www'
      ? segments[0]
      : null;
  }

  private async resolveTenant(identifier: string): Promise<Tenant> {
    const normalized = identifier.trim().toLowerCase();
    const tenantById = await this.tryResolve(() =>
      this.tenantsService.findById(normalized),
    );
    if (tenantById) return tenantById;

    const tenantByDomain = await this.tryResolve(() =>
      this.tenantsService.findByDomain(normalized),
    );
    if (tenantByDomain) return tenantByDomain;

    throw new NotFoundException(`Tenant tidak ditemukan: ${identifier}`);
  }

  private async tryResolve(resolver: () => Promise<Tenant>): Promise<Tenant | null> {
    try {
      return await resolver();
    } catch {
      return null;
    }
  }

  private isIpAddress(host: string): boolean {
    const ipv4 = /^\d{1,3}(?:\.\d{1,3}){3}$/;
    return ipv4.test(host) || host.includes(':');
  }

  private normalizeIdentifier(value?: string | null): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private isTenantOptional(req: TenantAwareRequest): boolean {
    const method = (req.method ?? '').toUpperCase();
    const url = (req.url ?? '').toLowerCase();

    if (method === 'POST') {
      if (
        url.startsWith('/auth/register') ||
        url.startsWith('/api/auth/register')
      ) {
        return true;
      }
    }

    return false;
  }
}
