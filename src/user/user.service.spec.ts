import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<Partial<UserRepository>>;

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
    userRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      createWithProfile: jest.fn(),
      findAllWithProfile: jest.fn(),
      findOneWithProfile: jest.fn(),
      getBalance: jest.fn(),
      topUp: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, { provide: UserRepository, useValue: userRepository }],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create user if email is not taken', async () => {
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (userRepository.createWithProfile as jest.Mock).mockResolvedValue(mockUser);

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
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);

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
      (userRepository.findAllWithProfile as jest.Mock).mockResolvedValue([mockUserProfile]);

      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('u-005');
    });
  });

  describe('findOne', () => {
    it('should return user with profile if found', async () => {
      (userRepository.findOneWithProfile as jest.Mock).mockResolvedValue(mockUserProfile);

      const result = await service.findOne('u-005');
      expect(result).toBeDefined();
      expect(result.id).toBe('u-005');
    });

    it('should throw NotFoundException if user not found', async () => {
      (userRepository.findOneWithProfile as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getBalance', () => {
    it('should return user balance if user exists', async () => {
      (userRepository.getBalance as jest.Mock).mockResolvedValue({
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
      (userRepository.getBalance as jest.Mock).mockResolvedValue(null);

      await expect(service.getBalance('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('topUp', () => {
    it('should top up user balance successfully', async () => {
      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.topUp as jest.Mock).mockResolvedValue({
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

  describe('remove', () => {
    it('should delete user if exists', async () => {
      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.delete as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.remove('u-005');
      expect(result).toEqual({ message: 'User berhasil dihapus.' });
    });

    it('should throw NotFoundException if user to delete not found', async () => {
      (userRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
