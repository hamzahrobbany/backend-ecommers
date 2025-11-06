import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

export class TokenUtil {
  constructor(private readonly jwtService: JwtService) {}

  async generateAccessToken(payload: JwtPayload): Promise<string> {
    const options: JwtSignOptions = {
      secret: process.env.JWT_ACCESS_SECRET!,
      expiresIn: (process.env.JWT_ACCESS_EXPIRES || '15m') as JwtSignOptions['expiresIn'], // ✅ fix
    };
    return this.jwtService.signAsync(payload, options);
  }

  async generateRefreshToken(payload: JwtPayload): Promise<string> {
    const options: JwtSignOptions = {
      secret: process.env.JWT_REFRESH_SECRET!,
      expiresIn: (process.env.JWT_REFRESH_EXPIRES || '7d') as JwtSignOptions['expiresIn'], // ✅ fix
    };
    return this.jwtService.signAsync(payload, options);
  }

  async generateTokenPair(payload: JwtPayload) {
    const access_token = await this.generateAccessToken(payload);
    const refresh_token = await this.generateRefreshToken(payload);
    return { access_token, refresh_token };
  }
}
