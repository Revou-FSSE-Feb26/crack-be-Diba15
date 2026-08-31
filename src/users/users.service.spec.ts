import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: jest.Mocked<Partial<UsersRepository>>;

  const mockUser = {
    id: 'u-005', // Dimas Prasetyo (Client dari seed.ts)
    name: 'Dimas Prasetyo',
    email: 'dimas@example.com',
    password: 'hashedpassword',
    role: 'client' as const,
    balance: 2000000,
    createdAt: new Date('2024-05-01T10:00:00Z'),
    updatedAt: new Date('2024-05-01T10:00:00Z'),
  };

  const mockUserProfile = {
    ...mockUser,
    profile: {
      avatarUrl: null,
      bio: null,
      instagramUrl: null,
      twitterUrl: null,
      pixivUrl: null,
      websiteUrl: null,
      isVerified: false,
      isOpenForCommission: false,
      basePriceIdr: null,
      strikeCount: 0,
      approvedPortfolioCount: 0,
    },
  };

  beforeEach(async () => {
    usersRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      createWithProfile: jest.fn(),
      findAllWithProfile: jest.fn(),
      findOneWithProfile: jest.fn(),
      getBalance: jest.fn(),
      topUp: jest.fn(),
      withdraw: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: UsersRepository, useValue: usersRepository }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create user if email is not taken', async () => {
      (usersRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (usersRepository.createWithProfile as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.create({
        name: 'Dimas Prasetyo',
        email: 'dimas@example.com',
        password: 'password123',
        role: 'client',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('u-005');
      expect(result.email).toBe('dimas@example.com');
      expect((result as any).password).toBeUndefined();
    });

    it('should throw ConflictException if email is taken', async () => {
      (usersRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        service.create({
          name: 'Dimas Prasetyo',
          email: 'dimas@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return array of users with profiles', async () => {
      (usersRepository.findAllWithProfile as jest.Mock).mockResolvedValue([mockUserProfile]);

      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('u-005');
    });
  });

  describe('findOne', () => {
    it('should return user with profile if found', async () => {
      (usersRepository.findOneWithProfile as jest.Mock).mockResolvedValue(mockUserProfile);

      const result = await service.findOne('u-005');
      expect(result).toBeDefined();
      expect(result.id).toBe('u-005');
    });

    it('should throw NotFoundException if user not found', async () => {
      (usersRepository.findOneWithProfile as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getBalance', () => {
    it('should return user balance if user exists', async () => {
      (usersRepository.getBalance as jest.Mock).mockResolvedValue({
        id: 'u-005',
        balance: 2000000,
      });

      const result = await service.getBalance('u-005');
      expect(result).toEqual({
        userId: 'u-005',
        balance: 2000000,
      });
    });

    it('should throw NotFoundException if user for balance check is not found', async () => {
      (usersRepository.getBalance as jest.Mock).mockResolvedValue(null);

      await expect(service.getBalance('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('topUp', () => {
    it('should top up user balance successfully', async () => {
      (usersRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (usersRepository.topUp as jest.Mock).mockResolvedValue({
        id: 'u-005',
        name: 'Dimas Prasetyo',
        email: 'dimas@example.com',
        role: 'client',
        balance: 2500000,
      });

      const result = await service.topUp('u-005', { amount: 500000 });
      expect(result.message).toBe('Top-up saldo berhasil.');
      expect(result.user.balance).toBe(2500000);
    });

    it('should throw BadRequestException if amount is <= 0', async () => {
      await expect(service.topUp('u-005', { amount: 0 })).rejects.toThrow(BadRequestException);
    });
  });

  describe('withdraw', () => {
    const artistMockUser = {
      ...mockUser,
      id: 'u-001',
      role: 'artist' as const,
      balance: 1000000,
    };

    const withdrawDto = {
      amount: 250000,
      bankName: 'BCA',
      accountNumber: '1234567890',
      accountName: 'Ari Ramadan',
    };

    it('should withdraw artist balance successfully if funds and role are valid', async () => {
      (usersRepository.findById as jest.Mock).mockResolvedValue(artistMockUser);
      (usersRepository.withdraw as jest.Mock).mockResolvedValue({
        ...artistMockUser,
        balance: 750000,
      });

      const result = await service.withdraw('u-001', withdrawDto);
      expect(result.message).toContain('berhasil diproses');
      expect(result.payout.amount).toBe(250000);
      expect(result.user.balance).toBe(750000);
      expect(usersRepository.withdraw).toHaveBeenCalledWith('u-001', 250000);
    });

    it('should throw BadRequestException if amount is < 100000', async () => {
      await expect(service.withdraw('u-001', { ...withdrawDto, amount: 50000 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ForbiddenException if user is not an artist', async () => {
      (usersRepository.findById as jest.Mock).mockResolvedValue({
        ...mockUser,
        role: 'client',
        balance: 1000000,
      });

      await expect(service.withdraw('u-005', withdrawDto)).rejects.toThrow(
        'Hanya akun artist yang dapat melakukan penarikan dana.',
      );
    });

    it('should throw BadRequestException if balance is insufficient', async () => {
      (usersRepository.findById as jest.Mock).mockResolvedValue({
        ...artistMockUser,
        balance: 150000,
      });

      await expect(service.withdraw('u-001', { ...withdrawDto, amount: 250000 })).rejects.toThrow(
        'Saldo Anda tidak mencukupi untuk melakukan penarikan dana ini.',
      );
    });
  });

  describe('remove', () => {
    it('should delete user if exists', async () => {
      (usersRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (usersRepository.delete as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.remove('u-005');
      expect(result).toEqual({ message: 'User berhasil dihapus.' });
    });

    it('should throw NotFoundException if user to delete not found', async () => {
      (usersRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
