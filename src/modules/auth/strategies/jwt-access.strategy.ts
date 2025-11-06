import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * Strategy untuk validasi Access Token (Bearer)
 * Digunakan oleh JwtAccessGuard di route yang dilindungi.
 */
@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_ACCESS_SECRET!, // ✅ fix: non-null assertion
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    return payload; // hasil validasi akan masuk ke req.user
  }
}
