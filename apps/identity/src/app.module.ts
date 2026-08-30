import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { MfaModule } from './modules/mfa/mfa.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { PasswordResetModule } from './modules/password-reset/password-reset.module';
import { EmailVerificationModule } from './modules/email-verification/email-verification.module';
import { LoginAttemptsModule } from './modules/login-attempts/login-attempts.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '.env.local'] }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    SessionsModule,
    MfaModule,
    ApiKeysModule,
    InvitationsModule,
    PasswordResetModule,
    EmailVerificationModule,
    LoginAttemptsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    HttpExceptionFilter,
  ],
})
export class AppModule {}
