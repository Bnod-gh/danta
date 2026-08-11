import { Controller, Post, Body } from '@nestjs/common';
import { PasswordResetService } from './password-reset.service';
import type { ForgotPassword, ResetPassword } from '@danta/schemas';
import { Public } from '../../common/decorators/permissions.decorator';

@Controller('auth')
@Public()
export class PasswordResetController {
  constructor(private readonly passwordResetService: PasswordResetService) {}

  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPassword) {
    return this.passwordResetService.requestReset(body.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: ResetPassword) {
    return this.passwordResetService.resetPassword(body.token, body.password);
  }
}
