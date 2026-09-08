import { PatientPortalService } from './patient-portal.service';

describe('PatientPortalService', () => {
  const prisma = {
    patient: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    organisation: {
      findUnique: jest.fn(),
    },
  };
  const jwtService = { sign: jest.fn().mockReturnValue('token') };
  const configService = { get: jest.fn().mockReturnValue('7d') };
  const auditService = { log: jest.fn().mockResolvedValue(undefined) };

  let service: PatientPortalService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PatientPortalService(prisma as any, jwtService as any, configService as any, auditService as any);
  });

  it('rejects protected fields during patient profile updates', async () => {
    prisma.patient.findFirst.mockResolvedValue({ id: 'patient-1', tenantId: 'tenant-1' });

    await expect(
      service.updatePatientProfile('patient-1', 'tenant-1', {
        email: 'new@example.com',
        status: 'active',
        passwordHash: 'attacker-controlled',
      } as any),
    ).rejects.toThrow();

    expect(prisma.patient.update).not.toHaveBeenCalled();
  });

  it('only updates the explicitly supported profile fields', async () => {
    prisma.patient.findFirst.mockResolvedValue({ id: 'patient-1', tenantId: 'tenant-1' });
    prisma.patient.update.mockResolvedValue({ id: 'patient-1', email: 'new@example.com' });

    await service.updatePatientProfile('patient-1', 'tenant-1', { email: 'new@example.com' } as any);

    expect(prisma.patient.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'patient-1' },
      data: { email: 'new@example.com' },
    }));
  });

  it('rejects patient registration when tenant is missing', async () => {
    await expect(
      service.register({
        email: 'new@example.com',
        password: 'Sup3rSecure!',
        firstName: 'Jane',
        lastName: 'Doe',
        dateOfBirth: new Date('2000-01-01'),
        tenantId: undefined,
      } as any),
    ).rejects.toThrow('Tenant ID is required');

    expect(prisma.organisation.findUnique).not.toHaveBeenCalled();
  });

  it('rejects patient registration when tenant is invalid', async () => {
    prisma.organisation.findUnique.mockResolvedValue({ id: 'tenant-1', status: 'suspended' });

    await expect(
      service.register({
        email: 'new@example.com',
        password: 'Sup3rSecure!',
        firstName: 'Jane',
        lastName: 'Doe',
        dateOfBirth: new Date('2000-01-01'),
        tenantId: 'tenant-1',
      } as any),
    ).rejects.toThrow('Invalid or inactive tenant');

    expect(prisma.patient.findFirst).not.toHaveBeenCalled();
  });

  it('rejects patient registration when no existing patient record matches the supplied contact', async () => {
    prisma.organisation.findUnique.mockResolvedValue({ id: 'tenant-1', status: 'active' });
    prisma.patient.findFirst.mockResolvedValue(null);

    await expect(
      service.register({
        email: 'new@example.com',
        password: 'Sup3rSecure!',
        firstName: 'Jane',
        lastName: 'Doe',
        dateOfBirth: new Date('2000-01-01'),
        tenantId: 'tenant-1',
      } as any),
    ).rejects.toThrow('Patient record not found');

    expect(prisma.patient.update).not.toHaveBeenCalled();
  });

  it('rejects patient registration when patient already has a password', async () => {
    prisma.organisation.findUnique.mockResolvedValue({ id: 'tenant-1', status: 'active' });
    prisma.patient.findFirst.mockResolvedValue({
      id: 'patient-1',
      tenantId: 'tenant-1',
      email: 'new@example.com',
      phone: null,
      status: 'active',
      passwordHash: 'existing-hash',
      patientNumber: 'P12345678',
      firstName: 'Jane',
      lastName: 'Doe',
      dateOfBirth: new Date('2000-01-01'),
    });

    await expect(
      service.register({
        email: 'new@example.com',
        password: 'Sup3rSecure!',
        firstName: 'Jane',
        lastName: 'Doe',
        dateOfBirth: new Date('2000-01-01'),
        tenantId: 'tenant-1',
      } as any),
    ).rejects.toThrow('already has a password');

    expect(prisma.patient.update).not.toHaveBeenCalled();
  });

  it('rejects patient registration when date of birth does not match', async () => {
    prisma.organisation.findUnique.mockResolvedValue({ id: 'tenant-1', status: 'active' });
    prisma.patient.findFirst.mockResolvedValue({
      id: 'patient-1',
      tenantId: 'tenant-1',
      email: 'new@example.com',
      phone: null,
      status: 'active',
      passwordHash: null,
      patientNumber: 'P12345678',
      firstName: 'Jane',
      lastName: 'Doe',
      dateOfBirth: new Date('1995-06-15'),
    });

    await expect(
      service.register({
        email: 'new@example.com',
        password: 'Sup3rSecure!',
        firstName: 'Jane',
        lastName: 'Doe',
        dateOfBirth: new Date('2000-01-01'),
        tenantId: 'tenant-1',
      } as any),
    ).rejects.toThrow('Date of birth verification failed');

    expect(prisma.patient.update).not.toHaveBeenCalled();
  });

  it('enrolls a patient against an existing tenant patient record instead of creating a new one', async () => {
    prisma.organisation.findUnique.mockResolvedValue({ id: 'tenant-1', status: 'active' });
    prisma.patient.findFirst.mockResolvedValue({
      id: 'patient-1',
      tenantId: 'tenant-1',
      email: 'new@example.com',
      phone: null,
      status: 'active',
      passwordHash: null,
      patientNumber: 'P12345678',
      firstName: 'Jane',
      lastName: 'Doe',
      preferredName: null,
      dateOfBirth: new Date('2000-01-01'),
    });
    prisma.patient.update.mockResolvedValue({
      id: 'patient-1',
      tenantId: 'tenant-1',
      email: 'new@example.com',
      patientNumber: 'P12345678',
      firstName: 'Jane',
      lastName: 'Doe',
      preferredName: null,
    });

    await service.register({
      email: 'new@example.com',
      password: 'Sup3rSecure!',
      firstName: 'Jane',
      lastName: 'Doe',
      dateOfBirth: new Date('2000-01-01'),
      tenantId: 'tenant-1',
    } as any);

    expect(prisma.patient.create).not.toHaveBeenCalled();
    expect(prisma.patient.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'patient-1' },
      data: expect.objectContaining({
        passwordHash: expect.any(String),
      }),
    }));
  });

  it('does not overwrite existing identity fields during registration', async () => {
    prisma.organisation.findUnique.mockResolvedValue({ id: 'tenant-1', status: 'active' });
    prisma.patient.findFirst.mockResolvedValue({
      id: 'patient-1',
      tenantId: 'tenant-1',
      email: 'original@example.com',
      phone: '+1234567890',
      status: 'active',
      passwordHash: null,
      patientNumber: 'P12345678',
      firstName: 'Original',
      lastName: 'Name',
      preferredName: null,
      dateOfBirth: new Date('1990-05-20'),
    });
    prisma.patient.update.mockResolvedValue({
      id: 'patient-1',
      tenantId: 'tenant-1',
      email: 'original@example.com',
      patientNumber: 'P12345678',
      firstName: 'Original',
      lastName: 'Name',
      preferredName: null,
    });

    await service.register({
      email: 'original@example.com',
      password: 'Sup3rSecure!',
      firstName: 'Attacker',
      lastName: 'FirstName',
      dateOfBirth: new Date('1990-05-20'),
      tenantId: 'tenant-1',
    } as any);

    expect(prisma.patient.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'patient-1' },
      data: expect.objectContaining({
        firstName: 'Original',
        lastName: 'Name',
        passwordHash: expect.any(String),
      }),
    }));
  });
});