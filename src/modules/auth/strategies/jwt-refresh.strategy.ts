import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { AuthRepository } from '../auth.repository';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly authRepo: AuthRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request): string | null => {
          const authHeader = req.headers.authorization;
          if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.split(' ')[1];
          }
          if (req.body?.refresh_token) {
            return req.body.refresh_token;
          }
          return null;
        },
      ]),
      secretOrKey: process.env.JWT_REFRESH_SECRET!,  // ✅ pastikan string
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const token =
      req.body?.refresh_token ||
      req.headers.authorization?.split(' ')[1];

    if (!token) throw new UnauthorizedException('Refresh token tidak ditemukan');

    const user = await this.authRepo.findUserById(payload.sub);
    if (!user) throw new UnauthorizedException('User tidak ditemukan');

    const valid = await this.authRepo.validateRefreshToken(user.id, token);
    if (!valid) throw new UnauthorizedException('Refresh token tidak valid');

    return payload;
  }
}
