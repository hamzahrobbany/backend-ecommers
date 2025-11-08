export interface JwtPayload {
  sub: string; // user ID
  email: string;
  role: string;
  tenantId: string; // multi-tenant context
  iat?: number;
  exp?: number;
}
