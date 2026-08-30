import { Injectable, Logger } from '@nestjs/common';
import { ClaimProvider } from './claim-provider.interface';

@Injectable()
export class MedicareProvider implements ClaimProvider {
  private readonly logger = new Logger(MedicareProvider.name);
  readonly name = 'medicare';

  async authenticate(credentials: Record<string, string>): Promise<{ success: boolean; error?: string }> {
    try {
      if (!credentials.apiKey || !credentials.secret) {
        return { success: false, error: 'Missing credentials' };
      }

      const response = await fetch('https://api.services.medicareaustralia.gov.au/v1/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'client_credentials', client_id: credentials.apiKey, client_secret: credentials.secret }),
      });

      if (!response.ok) {
        return { success: false, error: 'Authentication failed' };
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Medicare auth failed: ${error instanceof Error ? error.message : 'unknown'}`);
      return { success: false, error: error instanceof Error ? error.message : 'Medicare auth failed' };
    }
  }

  async submitClaim(claimData: Record<string, unknown>): Promise<{ success: boolean; externalClaimId?: string; error?: string }> {
    try {
      const response = await fetch('https://api.services.medicareaustralia.gov.au/v1/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(claimData),
      });

      if (!response.ok) {
        const text = await response.text();
        return { success: false, error: text || 'Claim submission failed' };
      }

      const result = await response.json();
      return { success: true, externalClaimId: result.claimId };
    } catch (error) {
      this.logger.error(`Medicare claim submit failed: ${error instanceof Error ? error.message : 'unknown'}`);
      return { success: false, error: error instanceof Error ? error.message : 'Medicare claim submit failed' };
    }
  }

  async checkStatus(claimId: string): Promise<{ status: string; paidAmount?: number; rejectionReason?: string; providerReference?: string }> {
    try {
      const response = await fetch(`https://api.services.medicareaustralia.gov.au/v1/claims/${claimId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        return { status: 'requires_review' };
      }

      const result = await response.json();
      return {
        status: result.status || 'pending',
        paidAmount: result.paidAmount,
        rejectionReason: result.rejectionReason,
        providerReference: result.providerReference,
      };
    } catch (error) {
      this.logger.error(`Medicare status check failed: ${error instanceof Error ? error.message : 'unknown'}`);
      return { status: 'requires_review' };
    }
  }

  async processPayment(response: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await fetch('https://api.services.medicareaustralia.gov.au/v1/payments/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(response),
      });

      if (!result.ok) {
        return { success: false, error: 'Payment processing failed' };
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Medicare payment processing failed: ${error instanceof Error ? error.message : 'unknown'}`);
      return { success: false, error: error instanceof Error ? error.message : 'Medicare payment processing failed' };
    }
  }
}
