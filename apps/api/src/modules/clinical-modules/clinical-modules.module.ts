import { Module } from '@nestjs/common';
import { ClinicalModulesService } from './clinical-modules.service';
import { ClinicalModulesInitializerService } from './clinical-modules-initializer.service';
import { ClinicalModulesController } from './clinical-modules.controller';

@Module({
  providers: [ClinicalModulesService, ClinicalModulesInitializerService],
  controllers: [ClinicalModulesController],
  exports: [ClinicalModulesService, ClinicalModulesInitializerService],
})
export class ClinicalModulesModule {}
