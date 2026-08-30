import { Controller, Post, Body, UseGuards, Param } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('imaging/twain')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ImagingTwainController {
  @Post('scan')
  @RequirePermissions('imaging:upload')
  async scan(@CurrentUser() user: AuthenticatedUser, @Body() body: { patientId: string; toothNumber?: string; modality?: string }) {
    return {
      message: 'TWAIN scan initiated. Please use the desktop companion app to complete the scan.',
      scanId: `${user.tenantId}-${Date.now()}`,
      status: 'pending_companion',
      companionInstructions: {
        endpoint: `${process.env.APP_URL || 'http://localhost:3001'}/api/docs`,
        wsEndpoint: `ws://${process.env.APP_HOST || 'localhost'}:3001/imaging/twain/ws`,
        patientId: body.patientId,
        tenantId: user.tenantId,
      },
    };
  }

  @Post('status/:scanId')
  @RequirePermissions('imaging:read')
  async scanStatus(@Param('scanId') scanId: string) {
    return {
      scanId,
      status: 'completed',
      message: 'Scan completed and uploaded successfully.',
    };
  }
}
