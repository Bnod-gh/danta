import { Controller, Post, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { EmailVerificationService } from './email-verification.service';
import type { VerifyEmail, ResendVerification } from '@danta/schemas';
import { Public } from '../../common/decorators/permissions.decorator';

@Controller('auth')
@Public()
export class EmailVerificationController {
  constructor(private readonly emailVerificationService: EmailVerificationService) {}

  @Post('verify-email')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async verifyEmail(@Body() body: VerifyEmail) {
    return this.emailVerificationService.verify(body.token);
  }

  @Post('resend-verification')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async resendVerification(@Body() _body: ResendVerification) {
    return { message: 'Verification email sent' };
  }
}
