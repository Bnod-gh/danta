import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma.service';
import { ConfigService } from '@nestjs/config';

export interface PatientJwtPayload {
  sub: string;
  email: string;
  phone: string;
  tenantId: string;
  patientNumber: string;
}

@Injectable()
export class PatientJwtStrategy extends PassportStrategy(Strategy, 'patient-jwt') {
  constructor(private readonly prisma: PrismaService, configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: PatientJwtPayload) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        phone: true,
        tenantId: true,
        patientNumber: true,
        firstName: true,
        lastName: true,
        preferredName: true,
        status: true,
      },
    });
    if (!patient || patient.status !== 'active') {
      return null;
    }
    return patient;
  }
}