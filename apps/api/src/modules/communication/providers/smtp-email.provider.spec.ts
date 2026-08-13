import { Test, TestingModule } from '@nestjs/testing';
import { SmtpEmailProvider } from './smtp-email.provider';

describe('SmtpEmailProvider', () => {
  let provider: SmtpEmailProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SmtpEmailProvider],
    }).compile();

    provider = module.get<SmtpEmailProvider>(SmtpEmailProvider);
  });

  it('should have name smtp', () => {
    expect(provider.name).toBe('smtp');
  });

  it('should fail when SMTP is not configured', async () => {
    const result = await provider.sendEmail({
      to: 'test@example.com',
      subject: 'Test',
      body: 'Test body',
    });

    expect(result.success).toBe(false);
    expect(result.provider).toBe('smtp');
    expect(result.error).toBeDefined();
  });

  it('should not support SMS', async () => {
    const result = await provider.sendSms();
    expect(result.success).toBe(false);
    expect(result.error).toBe('SMTP provider does not support SMS');
  });
});
