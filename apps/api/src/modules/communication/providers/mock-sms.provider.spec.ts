import { Test, TestingModule } from '@nestjs/testing';
import { MockSmsProvider } from './mock-sms.provider';

describe('MockSmsProvider', () => {
  let provider: MockSmsProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MockSmsProvider],
    }).compile();

    provider = module.get<MockSmsProvider>(MockSmsProvider);
  });

  it('should have name mock-sms', () => {
    expect(provider.name).toBe('mock-sms');
  });

  it('should return success for SMS', async () => {
    const result = await provider.sendSms({
      to: '+61400000000',
      body: 'Test SMS',
    });

    expect(result.success).toBe(true);
    expect(result.provider).toBe('mock-sms');
    expect(result.externalId).toBeDefined();
  });

  it('should not support email', async () => {
    const result = await provider.sendEmail({
      to: 'test@example.com',
      subject: 'Test',
      body: 'Test body',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Mock SMS provider does not support email');
  });
});
