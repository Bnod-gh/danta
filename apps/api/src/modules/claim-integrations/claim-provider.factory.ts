import { Injectable } from '@nestjs/common';
import { ClaimProvider } from './claim-provider.interface';
import { HicapsProvider } from './hicaps.provider';
import { MedicareProvider } from './medicare.provider';
import { DvaProvider } from './dva.provider';

@Injectable()
export class ClaimProviderFactory {
  private readonly providers: ClaimProvider[];

  constructor() {
    this.providers = [new HicapsProvider(), new MedicareProvider(), new DvaProvider()];
  }

  getProvider(name: string): ClaimProvider | undefined {
    return this.providers.find((p) => p.name === name);
  }
}
