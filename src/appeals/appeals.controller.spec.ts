import { Test, type TestingModule } from '@nestjs/testing';
import { AppealStatus } from '../generated/prisma/enums';
import { AppealsController } from './appeals.controller';
import { AppealsService } from './appeals.service';

describe('AppealsController', () => {
  let controller: AppealsController;
  let service: jest.Mocked<Partial<AppealsService>>;

  const mockAppealResponse = {
    id: 'app-001',
    artistId: 'u-001',
    reason:
      'Saya ingin mengajukan banding karena karya saya murni manual dengan bukti file PSD terlampir.',
    status: AppealStatus.pending,
    resolvedById: null,
    resolutionNotes: null,
    createdAt: new Date('2024-08-15T10:00:00.000Z'),
    updatedAt: new Date('2024-08-15T10:00:00.000Z'),
  };

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue(mockAppealResponse),
      findAll: jest.fn().mockResolvedValue([mockAppealResponse]),
      findMy: jest.fn().mockResolvedValue([mockAppealResponse]),
      findOne: jest.fn().mockResolvedValue(mockAppealResponse),
      resolve: jest.fn().mockResolvedValue({
        ...mockAppealResponse,
        status: AppealStatus.approved,
        resolvedById: 'u-007',
        resolutionNotes: 'Bukti valid.',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppealsController],
      providers: [{ provide: AppealsService, useValue: service }],
    }).compile();

    controller = module.get<AppealsController>(AppealsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call appealsService.create with correct params', async () => {
      const result = await controller.create('u-001', {
        reason:
          'Saya ingin mengajukan banding karena karya saya murni manual dengan bukti file PSD terlampir.',
      });

      expect(service.create).toHaveBeenCalledWith('u-001', {
        reason:
          'Saya ingin mengajukan banding karena karya saya murni manual dengan bukti file PSD terlampir.',
      });
      expect(result).toEqual(mockAppealResponse);
    });
  });

  describe('findAll', () => {
    it('should call appealsService.findAll with status query', async () => {
      const result = await controller.findAll(AppealStatus.pending);

      expect(service.findAll).toHaveBeenCalledWith(AppealStatus.pending);
      expect(result).toEqual([mockAppealResponse]);
    });
  });

  describe('findMy', () => {
    it('should call appealsService.findMy with artist id', async () => {
      const result = await controller.findMy('u-001');

      expect(service.findMy).toHaveBeenCalledWith('u-001');
      expect(result).toEqual([mockAppealResponse]);
    });
  });

  describe('findOne', () => {
    it('should call appealsService.findOne with appeal id', async () => {
      const result = await controller.findOne('app-001');

      expect(service.findOne).toHaveBeenCalledWith('app-001');
      expect(result).toEqual(mockAppealResponse);
    });
  });

  describe('resolve', () => {
    it('should call appealsService.resolve with admin id and resolve dto', async () => {
      const result = await controller.resolve('app-001', 'u-007', {
        approved: true,
        resolutionNotes: 'Bukti valid.',
      });

      expect(service.resolve).toHaveBeenCalledWith('app-001', 'u-007', {
        approved: true,
        resolutionNotes: 'Bukti valid.',
      });
      expect(result?.status).toBe(AppealStatus.approved);
      expect(result?.resolvedById).toBe('u-007');
    });
  });
});
