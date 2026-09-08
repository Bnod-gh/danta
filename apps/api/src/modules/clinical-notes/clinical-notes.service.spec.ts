import { ClinicalNotesService } from './clinical-notes.service';
import { AuditService } from '../audit/audit.service';

describe('ClinicalNotesService.synthesizeSoap', () => {
  let service: ClinicalNotesService;
  const audit = { log: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService;
  const prisma = {
    clinicalNote: {
      create: jest.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'note-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
        patientId: data.patientId ?? 'patient-1',
        type: 'soap',
        note: (data.note as string) ?? '',
        assessment: null,
        signedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    },
  } as never;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ClinicalNotesService(prisma, audit);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const input = {
    chiefComplaint: 'Tooth 14 sensitivity to cold',
    rawDictation: 'patient reports sharp pain on chewing, no swelling',
  };

  it('creates a soap clinical note with the chief complaint as note text', async () => {
    const result = await service.synthesizeSoap('tenant-1', 'user-1', { ...input, patientId: 'patient-1' });

    expect(result.note).toBe(input.chiefComplaint);
    expect(result.type).toBe('soap');
    expect((prisma as any).clinicalNote.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          patientId: 'patient-1',
          type: 'soap',
          note: input.chiefComplaint,
        }),
      }),
    );
  });

  it('falls back to subjective when chief complaint is missing', async () => {
    const result = await service.synthesizeSoap('tenant-1', 'user-1', { subjective: input.rawDictation, patientId: 'patient-1' });

    expect(result.note).toBe(input.rawDictation);
  });
});
