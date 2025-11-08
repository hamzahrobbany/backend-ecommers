import { Tenant } from '@prisma/client';

declare global {
  namespace Express {
    export interface Request {
      /**
       * Tenant aktif untuk request ini.
       * Diisi otomatis oleh TenantContextMiddleware.
       */
      tenant?: Tenant | null;
      tenantId?: string | null;
    }
  }
}

export {};
