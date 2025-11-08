import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';

interface TenantAwareRequest extends Request {
  tenantId?: string | null;
}

/**
 * Guard untuk melindungi route menggunakan access token (Bearer)
 */
@Injectable()
export class JwtAccessGuard extends AuthGuard('jwt-access') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: JwtPayload | false, info: any, context: ExecutionContext) {
    if (err || !user) {
      throw err || new UnauthorizedException('Token tidak valid atau sudah kadaluarsa');
    }

    if (!user.tenantId) {
      throw new UnauthorizedException('Tenant context missing in token');
    }

    const req = context.switchToHttp().getRequest<TenantAwareRequest>();
    req.tenantId = user.tenantId;

    return user;
  }
}
