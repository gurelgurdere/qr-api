import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from '../auth.model';

export interface JwtPayload {
  sub: number;
  username: string;
  user: AuthUser;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'qr-api-secret-key',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    return payload.user;
  }
}
