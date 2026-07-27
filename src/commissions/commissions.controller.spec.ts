import { Test, type TestingModule } from '@nestjs/testing';
import { CommissionsController } from './commissions.controller';
import { CommissionsService } from './commissions.service';

describe('CommissionsController', () => {
  let controller: CommissionsController;
  let service: jest.Mocked<Partial<CommissionsService>>;

  const mockCommissionResponse = {
    id: 'c-001',
    artists_id: 'u-001',
    client_id: 'u-005',
    commission_title: 'Ilustrasi keluarga bergaya watercolor',
    description: 'Potret keluarga kecil.',
    price: 450000,
    status: 'pending',
    payment_status: 'paid',
    payment_method: 'wallet',
    created_at: '2024-06-12T09:00:00.000Z',
    updated_at: '2024-06-12T09:00:00.000Z',
  };

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue(mockCommissionResponse),
      findAllByUser: jest.fn().mockResolvedValue([mockCommissionResponse]),
      findOne: jest.fn().mockResolvedValue(mockCommissionResponse),
      respond: jest.fn().mockResolvedValue({ ...mockCommissionResponse, status: 'in_progress' }),
      updateProgress: jest.fn().mockResolvedValue(mockCommissionResponse),
      approveStep: jest.fn().mockResolvedValue({ ...mockCommissionResponse, status: 'completed' }),
      addRevision: jest.fn().mockResolvedValue(mockCommissionResponse),
      cancel: jest.fn().mockResolvedValue({ ...mockCommissionResponse, status: 'cancelled' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommissionsController],
      providers: [{ provide: CommissionsService, useValue: service }],
    }).compile();

    controller = module.get<CommissionsController>(CommissionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call commissionsService.create', async () => {
      const dto = {
        artistsId: 'u-001',
        commissionTitle: 'Ilustrasi keluarga bergaya watercolor',
        price: 450000,
      };
      const result = await controller.create('u-005', dto);
      expect(service.create).toHaveBeenCalledWith('u-005', dto);
      expect(result).toEqual(mockCommissionResponse);
    });
  });

  describe('findAll', () => {
    it('should call commissionsService.findAllByUser', async () => {
      const result = await controller.findAll('u-005', 'client');
      expect(service.findAllByUser).toHaveBeenCalledWith('u-005', 'client');
      expect(result).toEqual([mockCommissionResponse]);
    });
  });
});
