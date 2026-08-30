import { Module } from '@nestjs/common';
import { EmailVerificationService } from './email-verification.service';

@Module({
  controllers: [],
  providers: [EmailVerificationService],
  exports: [EmailVerificationService],
})
export class EmailVerificationModule {}
