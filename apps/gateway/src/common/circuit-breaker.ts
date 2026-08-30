export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeoutMs: number;
}

export class CircuitOpenError extends Error {
  constructor() {
    super('Upstream circuit is open');
    this.name = 'CircuitOpenError';
  }
}

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private openedAt = 0;

  constructor(private readonly options: CircuitBreakerOptions) {}

  getState(now = Date.now()): CircuitState {
    if (this.state === 'open' && now - this.openedAt >= this.options.resetTimeoutMs) {
      this.state = 'half-open';
    }
    return this.state;
  }

  canRequest(now = Date.now()): boolean {
    return this.getState(now) !== 'open';
  }

  recordSuccess(): void {
    this.state = 'closed';
    this.failures = 0;
    this.openedAt = 0;
  }

  recordFailure(now = Date.now()): void {
    this.failures += 1;
    if (this.failures >= this.options.failureThreshold) {
      this.state = 'open';
      this.openedAt = now;
    }
  }

  assertCanRequest(now = Date.now()): void {
    if (!this.canRequest(now)) {
      throw new CircuitOpenError();
    }
  }
}