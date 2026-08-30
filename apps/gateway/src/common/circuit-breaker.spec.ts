import { CircuitBreaker, CircuitOpenError } from './circuit-breaker';

describe('CircuitBreaker', () => {
  it('opens after the failure threshold', () => {
    const breaker = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 1000 });

    breaker.recordFailure(100);
    expect(breaker.getState(100)).toBe('closed');

    breaker.recordFailure(200);
    expect(breaker.getState(200)).toBe('open');
    expect(() => breaker.assertCanRequest(200)).toThrow(CircuitOpenError);
  });

  it('allows one recovery request after the reset timeout', () => {
    const breaker = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 1000 });
    breaker.recordFailure(100);

    expect(breaker.canRequest(1099)).toBe(false);
    expect(breaker.canRequest(1100)).toBe(true);
    expect(breaker.getState(1100)).toBe('half-open');

    breaker.recordSuccess();
    expect(breaker.getState(1100)).toBe('closed');
  });

  it('resets failures after a successful response', () => {
    const breaker = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 1000 });

    breaker.recordFailure(100);
    breaker.recordSuccess();
    breaker.recordFailure(200);

    expect(breaker.getState(200)).toBe('closed');
  });
});
