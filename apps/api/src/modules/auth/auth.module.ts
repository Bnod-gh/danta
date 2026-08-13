import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LoginAttemptService } from './services/login-attempt.service';
import { UsersModule } from '../users/users.module';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../../prisma.module';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    PrismaModule,
    UsersModule,
    AuditModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRY') as any },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LoginAttemptService],
  exports: [AuthService],
})
export class AuthModule {}
