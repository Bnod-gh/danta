import { Test, TestingModule } from '@nestjs/testing';
import { CommunicationDispatchService } from './communication-dispatch.service';
import { PrismaService } from '../../../prisma.service';
import { CommunicationProviderFactory } from '../providers/communication-provider.factory';

describe('CommunicationDispatchService', () => {
  let service: CommunicationDispatchService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunicationDispatchService,
        PrismaService,
        CommunicationProviderFactory,
      ],
    }).compile();

    service = module.get<CommunicationDispatchService>(CommunicationDispatchService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('dispatchMessage', () => {
    it('should throw NotFoundException for nonexistent message', async () => {
      (prisma.message.findFirst as jest.Mock) = jest.fn().mockResolvedValue(null);

      await expect(service.dispatchMessage('nonexistent')).rejects.toThrow('Message not found');
    });

    it('should return true for already sent message', async () => {
      (prisma.message.findFirst as jest.Mock) = jest.fn().mockResolvedValue({
        id: 'msg-1',
        tenantId: 'tenant-1',
        patientId: 'patient-1',
        channel: 'email',
        status: 'sent',
        subject: 'Test',
        body: 'Body',
        recipient: 'test@example.com',
        provider: null,
        externalId: null,
        error: null,
        sentAt: new Date(),
        deliveredAt: null,
        readAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.dispatchMessage('msg-1');
      expect(result).toBe(true);
    });

    it('should skip failed messages', async () => {
      (prisma.message.findFirst as jest.Mock) = jest.fn().mockResolvedValue({
        id: 'msg-1',
        tenantId: 'tenant-1',
        patientId: 'patient-1',
        channel: 'email',
        status: 'failed',
        subject: 'Test',
        body: 'Body',
        recipient: 'test@example.com',
        provider: null,
        externalId: null,
        error: null,
        sentAt: null,
        deliveredAt: null,
        readAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.dispatchMessage('msg-1');
      expect(result).toBe(false);
    });
  });
});
