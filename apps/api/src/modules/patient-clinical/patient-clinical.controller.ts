import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { parseOrBadRequest } from '../../common/utils/parse-or-bad-request';
import { resolveUserPermissions } from '../../common/utils/user-permissions';
import { PrismaService } from '../../prisma.service';
import {
  ClinicalTimelineQuerySchema,
  HistoricalOdontogramQuerySchema,
  ToothHistoryQuerySchema,
} from '@danta/schemas';
import { PatientClinicalService } from './patient-clinical.service';

@Controller('patients/:patientId/clinical')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PatientClinicalController {
  constructor(
    private readonly clinicalService: PatientClinicalService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('odontogram')
  @RequirePermissions('dental_chart:read')
  async odontogram(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string) {
    return this.clinicalService.getCurrentOdontogram(user.tenantId, patientId);
  }

  @Get('odontogram/at')
  @RequirePermissions('dental_chart:read')
  async historicalOdontogram(
    @CurrentUser() user: AuthenticatedUser,
    @Param('patientId') patientId: string,
    @Query() query: unknown,
  ) {
    const parsed = parseOrBadRequest(HistoricalOdontogramQuerySchema, query);
    return this.clinicalService.getOdontogramAt(user.tenantId, patientId, parsed.date);
  }

  @Get('teeth/:toothNumber/history')
  @RequirePermissions('clinical:read')
  async toothHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('patientId') patientId: string,
    @Param('toothNumber') toothNumber: string,
    @Query() query: unknown,
  ) {
    const parsed = parseOrBadRequest(ToothHistoryQuerySchema, query);
    return this.clinicalService.getToothHistory(user.tenantId, patientId, toothNumber, parsed.skip, parsed.take);
  }

  /**
   * Unified timeline. Clinical event types are stripped unless the caller
   * holds clinical:read; billing types unless billing:read.
   */
  @Get('timeline')
  @RequirePermissions('patient:read')
  async timeline(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string, @Query() query: unknown) {
    const raw = (query ?? {}) as Record<string, unknown>;
    const normalized = {
      ...raw,
      types: typeof raw.types === 'string' ? raw.types.split(',').filter(Boolean) : raw.types,
    };
    const parsed = parseOrBadRequest(ClinicalTimelineQuerySchema, normalized);
    const permissions = await resolveUserPermissions(this.prisma, user.id, user.role);
    const includeClinical = permissions.includes('clinical:read');
    const includeBilling = permissions.includes('billing:read');

    let result = await this.clinicalService.getTimeline(user.tenantId, patientId, parsed, includeBilling);
    if (!includeClinical) {
      const clinicalTypes = new Set(['finding', 'treatment_completed', 'clinical_note']);
      const events = result.events.filter((e) => !clinicalTypes.has(e.type));
      result = { events, total: events.length };
    }
    return result;
  }
}
