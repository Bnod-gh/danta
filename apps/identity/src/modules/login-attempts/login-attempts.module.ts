import { Module } from '@nestjs/common';
import { LoginAttemptService } from './login-attempt.service';

@Module({
  controllers: [],
  providers: [LoginAttemptService],
  exports: [LoginAttemptService],
})
export class LoginAttemptsModule {}
