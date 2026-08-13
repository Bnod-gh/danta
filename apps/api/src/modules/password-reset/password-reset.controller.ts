import { Controller, Post, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PasswordResetService } from './password-reset.service';
import type { ForgotPassword, ResetPassword } from '@danta/schemas';
import { Public } from '../../common/decorators/permissions.decorator';

@Controller('auth')
@Public()
export class PasswordResetController {
  constructor(private readonly passwordResetService: PasswordResetService) {}

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async forgotPassword(@Body() body: ForgotPassword) {
    return this.passwordResetService.requestReset(body.email);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async resetPassword(@Body() body: ResetPassword) {
    return this.passwordResetService.resetPassword(body.token, body.password);
  }
}
