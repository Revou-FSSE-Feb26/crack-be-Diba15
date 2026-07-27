import { Test, type TestingModule } from '@nestjs/testing';
import { DisputesController } from './disputes.controller';
import { DisputesService } from './disputes.service';

describe('DisputesController', () => {
  let controller: DisputesController;
  let service: jest.Mocked<Partial<DisputesService>>;

  const mockDisputeResponse = {
    id: 'disp-001',
    commission_id: 'c-001',
    reason: 'Karya tidak sesuai deskripsi.',
    status: 'pending',
    mediator_id: null,
    created_at: '2024-08-15T12:00:00.000Z',
  };

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue(mockDisputeResponse),
      findAll: jest.fn().mockResolvedValue([mockDisputeResponse]),
      findOne: jest.fn().mockResolvedValue(mockDisputeResponse),
      resolve: jest.fn().mockResolvedValue({
        ...mockDisputeResponse,
        status: 'approved',
        mediator_id: 'u-008',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DisputesController],
      providers: [{ provide: DisputesService, useValue: service }],
    }).compile();

    controller = module.get<DisputesController>(DisputesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call disputesService.create', async () => {
      const dto = {
        commissionId: 'c-001',
        reason: 'Karya tidak sesuai deskripsi.',
      };

      const result = await controller.create('u-005', dto);
      expect(service.create).toHaveBeenCalledWith('u-005', dto);
      expect(result).toEqual(mockDisputeResponse);
    });
  });

  describe('findAll', () => {
    it('should call disputesService.findAll', async () => {
      const result = await controller.findAll('pending' as any);
      expect(service.findAll).toHaveBeenCalledWith('pending');
      expect(result).toEqual([mockDisputeResponse]);
    });
  });

  describe('resolve', () => {
    it('should call disputesService.resolve with curator id and dto', async () => {
      const result = await controller.resolve('disp-001', 'u-008', {
        status: 'approved' as any,
      });

      expect(service.resolve).toHaveBeenCalledWith('disp-001', 'u-008', {
        status: 'approved',
      });
      expect(result?.status).toBe('approved');
      expect(result?.mediator_id).toBe('u-008');
    });
  });
});
