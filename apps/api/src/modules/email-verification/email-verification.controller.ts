import { Controller, Post, Body } from '@nestjs/common';
import { EmailVerificationService } from './email-verification.service';
import type { VerifyEmail, ResendVerification } from '@danta/schemas';
import { Public } from '../../common/decorators/permissions.decorator';

@Controller('auth')
@Public()
export class EmailVerificationController {
  constructor(private readonly emailVerificationService: EmailVerificationService) {}

  @Post('verify-email')
  async verifyEmail(@Body() body: VerifyEmail) {
    return this.emailVerificationService.verify(body.token);
  }

  @Post('resend-verification')
  async resendVerification(@Body() _body: ResendVerification) {
    return { message: 'Verification email sent' };
  }
}
