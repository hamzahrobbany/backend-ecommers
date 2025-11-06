import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard untuk melindungi route menggunakan access token (Bearer)
 */
@Injectable()
export class JwtAccessGuard extends AuthGuard('jwt-access') {}
