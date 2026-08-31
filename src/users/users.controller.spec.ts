import { Test, type TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<Partial<UsersService>>;

  const mockUserResponse = {
    id: 'u-005', // Dimas Prasetyo (Client)
    name: 'Dimas Prasetyo',
    email: 'dimas@example.com',
    role: 'client' as const,
    balance: 2000000,
    createdAt: new Date('2024-05-01T10:00:00Z'),
    updatedAt: new Date('2024-05-01T10:00:00Z'),
  };

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue(mockUserResponse),
      findAll: jest.fn().mockResolvedValue([mockUserResponse]),
      findOne: jest.fn().mockResolvedValue(mockUserResponse),
      update: jest.fn().mockResolvedValue(mockUserResponse),
      getBalance: jest.fn().mockResolvedValue({ userId: 'u-005', balance: 2000000 }),
      topUp: jest.fn().mockResolvedValue({
        message: 'Top-up saldo berhasil.',
        user: { ...mockUserResponse, balance: 2500000 },
      }),
      withdraw: jest.fn().mockResolvedValue({
        message: 'Permintaan penarikan dana sebesar Rp 250.000 berhasil diproses.',
        payout: {
          amount: 250000,
          bankName: 'BCA',
          accountNumber: '1234567890',
          accountName: 'Ari Ramadan',
          processedAt: new Date().toISOString(),
        },
        user: { ...mockUserResponse, id: 'u-001', role: 'artist', balance: 750000 },
      }),
      remove: jest.fn().mockResolvedValue({ message: 'User berhasil dihapus.' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getBalance', () => {
    it('should call usersService.getBalance with current user id', async () => {
      const result = await controller.getBalance('u-005');
      expect(service.getBalance).toHaveBeenCalledWith('u-005');
      expect(result).toEqual({ userId: 'u-005', balance: 2000000 });
    });
  });

  describe('topUp', () => {
    it('should call usersService.topUp with current user id and dto', async () => {
      const dto = { amount: 500000 };
      const result = await controller.topUp('u-005', dto);
      expect(service.topUp).toHaveBeenCalledWith('u-005', dto);
      expect(result.message).toBe('Top-up saldo berhasil.');
      expect(result.user.balance).toBe(2500000);
    });
  });

  describe('withdraw', () => {
    it('should call usersService.withdraw with current artist user id and dto', async () => {
      const dto = {
        amount: 250000,
        bankName: 'BCA',
        accountNumber: '1234567890',
        accountName: 'Ari Ramadan',
      };
      const result = await controller.withdraw('u-001', dto);
      expect(service.withdraw).toHaveBeenCalledWith('u-001', dto);
      expect(result.payout.amount).toBe(250000);
      expect(result.user.balance).toBe(750000);
    });
  });

  describe('create', () => {
    it('should create user', async () => {
      const dto = {
        name: 'Dimas Prasetyo',
        email: 'dimas@example.com',
        password: 'password123',
        role: 'client' as const,
      };
      const result = await controller.create(dto);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockUserResponse);
    });
  });

  describe('findAll', () => {
    it('should return list of users', async () => {
      const result = await controller.findAll();
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockUserResponse]);
    });
  });

  describe('findOne', () => {
    it('should return user detail if requester is self or admin', async () => {
      const requester = { sub: 'u-005', email: 'dimas@example.com', role: 'client' };
      const result = await controller.findOne('u-005', requester as any);
      expect(service.findOne).toHaveBeenCalledWith('u-005');
      expect(result).toEqual(mockUserResponse);
    });
  });

  describe('update', () => {
    it('should update user detail', async () => {
      const requester = { sub: 'u-005', email: 'dimas@example.com', role: 'client' };
      const dto = { name: 'Dimas Updated' };
      const result = await controller.update('u-005', dto, requester as any);
      expect(service.update).toHaveBeenCalledWith('u-005', dto);
      expect(result).toEqual(mockUserResponse);
    });
  });

  describe('remove', () => {
    it('should delete user', async () => {
      const result = await controller.remove('u-005');
      expect(service.remove).toHaveBeenCalledWith('u-005');
      expect(result).toEqual({ message: 'User berhasil dihapus.' });
    });
  });
});
