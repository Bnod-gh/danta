import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ClinicalModulesService } from './clinical-modules.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { CreateSchedulingResource, CreateSchedulingResourceModule } from '@danta/schemas';

@Controller('clinical-modules')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ClinicalModulesController {
  constructor(private readonly clinicalModulesService: ClinicalModulesService) {}

  @Get('modules')
  async getModules() {
    return this.clinicalModulesService.getClinicalModules();
  }

  @Get('modules/category/:category')
  async getModulesByCategory(@Param('category') category: string) {
    return this.clinicalModulesService.getClinicalModulesByCategory(category);
  }

  @Get('resources')
  async getResources(@Request() req: any) {
    const tenantId = req.user.tenantId;
    return this.clinicalModulesService.getTenantSchedulingResources(tenantId);
  }

  @Get('resources/:resourceId')
  async getResource(@Request() req: any, @Param('resourceId') resourceId: string) {
    const tenantId = req.user.tenantId;
    return this.clinicalModulesService.getSchedulingResource(tenantId, resourceId);
  }

  @Post('resources')
  async createResource(@Request() req: any, @Body() data: CreateSchedulingResource) {
    const tenantId = req.user.tenantId;
    return this.clinicalModulesService.createSchedulingResource(tenantId, data);
  }

  @Put('resources/:resourceId')
  async updateResource(
    @Request() req: any,
    @Param('resourceId') resourceId: string,
    @Body() data: Partial<Omit<CreateSchedulingResource, 'type'>>
  ) {
    const tenantId = req.user.tenantId;
    return this.clinicalModulesService.updateSchedulingResource(tenantId, resourceId, data);
  }

  @Post('resources/:resourceId/modules/:moduleId')
  async addModuleToResource(
    @Request() req: any,
    @Param('resourceId') resourceId: string,
    @Param('moduleId') moduleId: string,
    @Body() data?: CreateSchedulingResourceModule
  ) {
    const tenantId = req.user.tenantId;
    return this.clinicalModulesService.addModuleToResource(tenantId, resourceId, moduleId, data);
  }

  @Put('resources/:resourceId/modules/:moduleId')
  async updateResourceModule(
    @Request() req: any,
    @Param('resourceId') resourceId: string,
    @Param('moduleId') moduleId: string,
    @Body() data: Partial<Omit<CreateSchedulingResourceModule, 'clinicalModuleId'>>
  ) {
    const tenantId = req.user.tenantId;
    return this.clinicalModulesService.updateResourceModule(tenantId, resourceId, moduleId, data);
  }

  @Delete('resources/:resourceId/modules/:moduleId')
  async removeModuleFromResource(
    @Param('resourceId') resourceId: string,
    @Param('moduleId') moduleId: string
  ) {
    await this.clinicalModulesService.removeModuleFromResource(resourceId, moduleId);
    return { deleted: true };
  }

  @Get('resources/:resourceId/modules/active')
  async getActiveModules(@Param('resourceId') resourceId: string) {
    return this.clinicalModulesService.getActiveModulesForResource(resourceId);
  }
}
