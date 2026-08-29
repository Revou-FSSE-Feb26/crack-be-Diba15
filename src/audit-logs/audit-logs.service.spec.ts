import { Test, type TestingModule } from '@nestjs/testing';
import type { AuditLogsRepositoryInterface } from '../common/interfaces/audit-logs.repository.interface';
import { AuditLogsService } from './audit-logs.service';

describe('AuditLogsService', () => {
  let service: AuditLogsService;
  let repository: jest.Mocked<AuditLogsRepositoryInterface>;

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
    repository = {
      findAll: jest.fn().mockResolvedValue(mockAuditResult),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogsService,
        {
          provide: 'IAuditLogsRepository',
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<AuditLogsService>(AuditLogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated audit logs', async () => {
      const result = await service.findAll({ category: 'curation', page: 1, limit: 10 });

      expect(result).toEqual(mockAuditResult);
      expect(repository.findAll).toHaveBeenCalledWith({
        category: 'curation',
        search: undefined,
        startDate: undefined,
        endDate: undefined,
        page: 1,
        limit: 10,
      });
    });
  });
});
