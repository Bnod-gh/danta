import { ClinicalNotesService } from './clinical-notes.service';
import { AuditService } from '../audit/audit.service';
import { env } from '@danta/config';

jest.mock('@danta/config', () => ({
  env: {
    openaiApiKey: '',
    openaiModel: 'gpt-4o-mini',
    openaiBaseUrl: 'https://api.openai.com/v1',
  },
}));

describe('ClinicalNotesService.synthesizeSoap', () => {
  let service: ClinicalNotesService;
  const audit = { log: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService;
  const prisma = {} as never;

  beforeEach(() => {
    jest.clearAllMocks();
    (env as { openaiApiKey: string }).openaiApiKey = '';
    global.fetch = jest.fn();
    service = new ClinicalNotesService(prisma, audit);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const input = {
    chiefComplaint: 'Tooth 14 sensitivity to cold',
    rawDictation: 'patient reports sharp pain on chewing, no swelling',
  };

  it('composes a template SOAP note when no LLM key is configured', async () => {
    const result = await service.synthesizeSoap('tenant-1', 'user-1', { ...input, patientId: 'patient-1' });

    expect(result.subjective).toContain(input.rawDictation);
    expect(result.assessment).toContain('Tooth 14 sensitivity to cold');
  });

  it('prefers clinician-drafted sections over template filler', async () => {
    const result = await service.synthesizeSoap('tenant-1', 'user-1', {
      ...input,
      patientId: 'patient-1',
      objective: 'Tooth 14: intact composite, no mobility, cold stimulus positive.',
      plan: 'Replace composite on tooth 14; monitor.',
    });

    expect(result.plan).toContain('Replace composite');
    // assessment/subjective still auto-composed
  });

  it('uses the LLM response when a key is configured and the call succeeds', async () => {
    (env as { openaiApiKey: string }).openaiApiKey = 'test-key';
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                subjective: 'AI S text',
                objective: 'AI O text',
                assessment: 'AI A text',
                plan: 'AI P text',
              }),
            },
          },
        ],
      }),
    });

    const result = await service.synthesizeSoap('tenant-1', 'user-1', { ...input, patientId: 'patient-1' });

    expect(result.subjective).toBe('AI S text');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('falls back to the composer when the LLM call fails', async () => {
    (env as { openaiApiKey: string }).openaiApiKey = 'test-key';
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network down'));

    const result = await service.synthesizeSoap('tenant-1', 'user-1', { ...input, patientId: 'patient-1' });

    expect(result.subjective).toContain(input.rawDictation);
  });
});
