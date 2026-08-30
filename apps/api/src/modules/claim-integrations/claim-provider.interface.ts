export interface ClaimProvider {
  readonly name: string;
  authenticate(credentials: Record<string, string>): Promise<{ success: boolean; error?: string }>;
  submitClaim(claimData: Record<string, unknown>): Promise<{ success: boolean; externalClaimId?: string; error?: string }>;
  checkStatus(claimId: string): Promise<{ status: string; paidAmount?: number; processedAt?: string; rejectionReason?: string; providerReference?: string }>;
  processPayment(response: Record<string, unknown>): Promise<{ success: boolean; error?: string }>;
}
