import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  it('requires JWT_SECRET', () => {
    const config = { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService;

    expect(() => new JwtStrategy(config)).toThrow('JWT_SECRET must be configured');
  });

  it('uses the configured JWT_SECRET', () => {
    const config = { get: jest.fn().mockReturnValue('test-secret') } as unknown as ConfigService;

    expect(() => new JwtStrategy(config)).not.toThrow();
  });
});
