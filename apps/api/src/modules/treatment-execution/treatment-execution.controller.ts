import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { parseOrBadRequest } from '../../common/utils/parse-or-bad-request';
import { PerformTreatmentsSchema } from '@danta/schemas';
import { TreatmentExecutionService } from './treatment-execution.service';

@Controller('appointments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TreatmentExecutionController {
  constructor(private readonly executionService: TreatmentExecutionService) {}

  @Post(':id/perform-treatments')
  @RequirePermissions('clinical:create')
  async perform(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const data = parseOrBadRequest(PerformTreatmentsSchema, body);
    return this.executionService.performForAppointment(user.tenantId, user.id, id, data);
  }
}
