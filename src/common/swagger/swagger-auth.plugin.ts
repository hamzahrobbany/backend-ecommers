/**
 * ============================================================================
 * 📘 Swagger Auth Plugin — E-Commerce Backend
 * ============================================================================
 * Fungsi:
 * - Menyuntikkan header Authorization dan X-Tenant-ID ke semua request Swagger UI.
 * - Memudahkan pengujian multi-tenant tanpa frontend.
 *
 * 💡 Cara menyimpan token & tenant ID di browser DevTools (Console):
 * ```ts
 * localStorage.setItem('swagger:auth-token', 'token-anda');
 * localStorage.setItem('swagger:tenant-id', 'tenant-id-anda');
 * ```
 * ============================================================================
 */

const TOKEN_STORAGE_KEY = 'swagger:auth-token';
const TENANT_STORAGE_KEY = 'swagger:tenant-id';

type StorageLike = {
  getItem(key: string): string | null;
};

type SwaggerClientRequest = {
  headers?: Record<string, string>;
  [key: string]: unknown;
};

/**
 * Pastikan objek headers selalu ada.
 */
const ensureHeaders = (req: SwaggerClientRequest): SwaggerClientRequest => {
  if (!req.headers) {
    req.headers = {};
  }
  return req;
};

/**
 * Mendapatkan akses ke localStorage browser (aman di environment browser-only).
 */
const getBrowserLocalStorage = (): StorageLike | undefined => {
  const globalRef: Record<string, unknown> | undefined =
    typeof globalThis !== 'undefined' ? (globalThis as Record<string, unknown>) : undefined;

  if (!globalRef) return undefined;

  const candidate: unknown =
    (globalRef.localStorage as unknown) ??
    ((globalRef.window as Record<string, unknown> | undefined)?.localStorage as unknown);

  if (!candidate) return undefined;

  const storage = candidate as StorageLike;
  if (typeof storage.getItem !== 'function') return undefined;

  return storage;
};

/**
 * Menyuntikkan Authorization dan X-Tenant-ID jika tersedia di localStorage.
 */
const injectAuthHeaders = (req: SwaggerClientRequest): SwaggerClientRequest => {
  const storage = getBrowserLocalStorage();
  if (!storage) return req;

  const token = storage.getItem(TOKEN_STORAGE_KEY);
  const tenantId = storage.getItem(TENANT_STORAGE_KEY);

  ensureHeaders(req);

  if (token && !req.headers?.Authorization && !req.headers?.authorization) {
    req.headers = {
      ...req.headers,
      Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
    };
  }

  if (tenantId && !req.headers?.['X-Tenant-ID']) {
    req.headers = {
      ...req.headers,
      'X-Tenant-ID': tenantId,
    };
  }

  return req;
};

/**
 * Plugin utama untuk Swagger UI (dipasang via swaggerOptions.plugins)
 */
export const swaggerAuthPlugin = () => ({
  fn: {
    fetch:
      (originalFetch: (req: SwaggerClientRequest) => Promise<unknown>) =>
      (req: SwaggerClientRequest) => {
        const requestWithHeaders = injectAuthHeaders({ ...req });
        return originalFetch(requestWithHeaders);
      },
  },
});

/**
 * Alternatif interceptor untuk Swagger request (opsional)
 */
export const swaggerRequestInterceptor = (req: SwaggerClientRequest) => {
  return injectAuthHeaders(req);
};

/**
 * Petunjuk cara menyimpan token & tenant di browser console.
 */
export const swaggerAuthStorageInstructions = `
🧩 Cara menyiapkan Swagger Authorization & Tenant:

Buka DevTools → tab Console, lalu jalankan perintah berikut:
-----------------------------------------------------------
localStorage.setItem('${TOKEN_STORAGE_KEY}', 'Bearer <ACCESS_TOKEN>');
localStorage.setItem('${TENANT_STORAGE_KEY}', 'salwa');
-----------------------------------------------------------
Setelah itu refresh halaman Swagger Docs dan semua request
akan otomatis menyertakan header Authorization dan X-Tenant-ID.
`;

export const swaggerAuthStorageKeys = {
  token: TOKEN_STORAGE_KEY,
  tenant: TENANT_STORAGE_KEY,
};

export type SwaggerAuthPlugin = ReturnType<typeof swaggerAuthPlugin>;
