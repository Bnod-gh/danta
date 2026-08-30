import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ProcedureCodesService } from './procedure-codes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('procedure-codes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProcedureCodesController {
  constructor(private readonly procedure_codessService: ProcedureCodesService) {}

  @Get()
  @RequirePermissions('billing:read')
  async findAll(@Query('category') category?: string, @Query('search') search?: string) {
    return this.procedure_codessService.findAll(category, search);
  }

  @Get('categories')
  @RequirePermissions('billing:read')
  async categories() {
    return this.procedure_codessService.findCategories();
  }
}
