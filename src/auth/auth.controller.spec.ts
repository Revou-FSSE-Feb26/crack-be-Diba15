import { Test, type TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<Partial<AuthService>>;

  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as any;

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      getMe: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register and set cookie', async () => {
      (authService.register as jest.Mock).mockResolvedValue({
        accessToken: 'mock-access',
        refreshToken: 'mock-refresh',
      });

      const result = await controller.register(
        {
          name: 'Ari Ramadan',
          email: 'ari@example.com',
          password: 'password123',
          role: 'artist' as any,
        },
        'Mozilla/5.0',
        mockResponse,
      );

      expect(result).toEqual({ accessToken: 'mock-access' });
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'mock-refresh',
        expect.any(Object),
      );
    });
  });

  describe('login', () => {
    it('should call authService.login and set cookie', async () => {
      (authService.login as jest.Mock).mockResolvedValue({
        accessToken: 'mock-access',
        refreshToken: 'mock-refresh',
      });

      const result = await controller.login(
        {
          email: 'ari@example.com',
          password: 'password123',
        },
        'Mozilla/5.0',
        mockResponse,
      );

      expect(result).toEqual({ accessToken: 'mock-access' });
      expect(mockResponse.cookie).toHaveBeenCalled();
    });
  });

  describe('getMe', () => {
    it('should return user profile from authService.getMe', async () => {
      const mockProfile = { id: 'u-001', name: 'Ari Ramadan', email: 'ari@example.com' };
      (authService.getMe as jest.Mock).mockResolvedValue(mockProfile);

      const result = await controller.getMe('u-001');

      expect(result).toEqual(mockProfile);
      expect(authService.getMe).toHaveBeenCalledWith('u-001');
    });
  });
});
