import { Test, type TestingModule } from '@nestjs/testing';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';

describe('AuditLogsController', () => {
  let controller: AuditLogsController;
  let service: jest.Mocked<Partial<AuditLogsService>>;

  const mockAuditResult = {
    data: [
      {
        id: 'audit-cur-a-001',
        category: 'curation' as const,
        action: 'Persetujuan Artwork',
        actor: {
          id: 'u-008',
          name: 'Siti Kurator',
          email: 'curator@example.com',
          role: 'curator',
        },
        targetType: 'artwork',
        targetId: 'a-001',
        targetTitle: 'Senja di Tepi Sungai Ciliwung',
        details: 'Artwork lolos verifikasi keaslian manual anti-AI.',
        status: 'approved',
        createdAt: new Date('2024-08-10T10:00:00Z'),
      },
    ],
    total: 1,
    page: 1,
    limit: 10,
  };

  beforeEach(async () => {
    service = {
      findAll: jest.fn().mockResolvedValue(mockAuditResult),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditLogsController],
      providers: [{ provide: AuditLogsService, useValue: service }],
    }).compile();

    controller = module.get<AuditLogsController>(AuditLogsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call auditLogsService.findAll with query', async () => {
      const query = { category: 'curation' as const, page: 1, limit: 10 };
      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockAuditResult);
    });
  });
});
