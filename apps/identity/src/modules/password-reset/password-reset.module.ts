import { Module } from '@nestjs/common';
import { PasswordResetService } from './password-reset.service';

@Module({
  controllers: [],
  providers: [PasswordResetService],
  exports: [PasswordResetService],
})
export class PasswordResetModule {}
