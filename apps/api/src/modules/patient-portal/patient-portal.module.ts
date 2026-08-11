import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PatientPortalController } from './patient-portal.controller';
import { PatientPortalService } from './patient-portal.service';
import { PatientJwtStrategy } from './strategies/patient-jwt.strategy';
import { PrismaModule } from '../../prisma.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRY') as any },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [PatientPortalController],
  providers: [PatientPortalService, PatientJwtStrategy],
  exports: [PatientPortalService],
})
export class PatientPortalModule {}
