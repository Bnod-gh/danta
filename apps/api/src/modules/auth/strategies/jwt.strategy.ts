import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  tenantId: string;
  practiceId?: string;
  locationId?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    const jwtSecret = process.env.JWT_SECRET || '';
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        tenantId: true,
        practiceId: true,
        locationId: true,
        status: true,
        firstName: true,
        lastName: true,
      },
    });
    if (!user || user.status !== 'active') {
      return null;
    }
    return user;
  }
}
