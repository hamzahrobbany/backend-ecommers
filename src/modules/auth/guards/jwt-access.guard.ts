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

  handleRequest<TUser extends JwtPayload = JwtPayload>(
    err: any,
    user: TUser | false,
    info: any,
    context: ExecutionContext,
    status?: any,
  ): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Token tidak valid atau sudah kadaluarsa');
    }

    if (!user.tenantId) {
      throw new UnauthorizedException('Tenant context missing in token');
    }

    const req = context.switchToHttp().getRequest<TenantAwareRequest>();
    if (req.tenantId && req.tenantId !== user.tenantId) {
      throw new UnauthorizedException('Tenant context mismatch between token and request');
    }

    req.tenantId = user.tenantId;

    return user;
  }
}
