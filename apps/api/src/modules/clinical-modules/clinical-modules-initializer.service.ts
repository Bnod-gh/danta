import { Injectable } from '@nestjs/common';
import { ClinicalModulesService } from './clinical-modules.service';
import { DEFAULT_ODONTOGRAM_MODULES } from '@danta/schemas';

@Injectable()
export class ClinicalModulesInitializerService {
  constructor(private readonly clinicalModulesService: ClinicalModulesService) {}

  /**
   * Initialize clinical modules and resources for a new tenant.
   * This should be called during tenant creation.
   */
  async initializeForTenant(tenantId: string): Promise<void> {
    // Initialize system-wide modules (only once)
    try {
      await this.clinicalModulesService.initializeDefaultModules();
    } catch (err) {
      // Modules may already exist, that's okay
      console.log('Clinical modules already initialized');
    }

    // Initialize tenant-specific Odontogram resource with default modules
    try {
      await this.clinicalModulesService.initializeDefaultOdontogramResource(tenantId);
    } catch (err) {
      console.error('Failed to initialize Odontogram resource:', err);
    }
  }

  /**
   * Get all default clinical module types for documentation
   */
  getDefaultModuleTypes(): string[] {
    return DEFAULT_ODONTOGRAM_MODULES.map((m) => m.type);
  }
}
