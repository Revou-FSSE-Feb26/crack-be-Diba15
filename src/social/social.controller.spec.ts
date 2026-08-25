import { Test, type TestingModule } from '@nestjs/testing';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';

describe('SocialController', () => {
  let controller: SocialController;
  let service: jest.Mocked<Partial<SocialService>>;

  const mockArtwork = {
    id: 'a-001',
    artists_id: 'u-001',
    title: 'Neon Samurai',
    images_url: ['https://example.com/art1.jpg'],
  };

  const mockArtist = {
    id: 'u-001',
    name: 'Ari Ramadan',
  };

  beforeEach(async () => {
    service = {
      toggleFavorite: jest
        .fn()
        .mockResolvedValue({ isFavorited: true, message: 'Ditambahkan ke favorit.' }),
      getFavorites: jest.fn().mockResolvedValue([mockArtwork as any]),
      getFavoriteIds: jest.fn().mockResolvedValue(['a-001']),
      toggleFollow: jest
        .fn()
        .mockResolvedValue({ isFollowing: true, message: 'Berhasil mengikuti artis.' }),
      getFollowing: jest.fn().mockResolvedValue([mockArtist as any]),
      getFollowingIds: jest.fn().mockResolvedValue(['u-001']),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SocialController],
      providers: [{ provide: SocialService, useValue: service }],
    }).compile();

    controller = module.get<SocialController>(SocialController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('toggleFavorite', () => {
    it('should call socialService.toggleFavorite', async () => {
      const result = await controller.toggleFavorite('u-005', 'a-001');
      expect(service.toggleFavorite).toHaveBeenCalledWith('u-005', 'a-001');
      expect(result).toEqual({ isFavorited: true, message: 'Ditambahkan ke favorit.' });
    });
  });

  describe('getFavorites', () => {
    it('should call socialService.getFavorites', async () => {
      const result = await controller.getFavorites('u-005');
      expect(service.getFavorites).toHaveBeenCalledWith('u-005');
      expect(result).toEqual([mockArtwork]);
    });
  });

  describe('getFavoriteIds', () => {
    it('should call socialService.getFavoriteIds', async () => {
      const result = await controller.getFavoriteIds('u-005');
      expect(service.getFavoriteIds).toHaveBeenCalledWith('u-005');
      expect(result).toEqual(['a-001']);
    });
  });

  describe('toggleFollow', () => {
    it('should call socialService.toggleFollow', async () => {
      const result = await controller.toggleFollow('u-005', 'u-001');
      expect(service.toggleFollow).toHaveBeenCalledWith('u-005', 'u-001');
      expect(result).toEqual({ isFollowing: true, message: 'Berhasil mengikuti artis.' });
    });
  });

  describe('getFollowing', () => {
    it('should call socialService.getFollowing', async () => {
      const result = await controller.getFollowing('u-005');
      expect(service.getFollowing).toHaveBeenCalledWith('u-005');
      expect(result).toEqual([mockArtist]);
    });
  });

  describe('getFollowingIds', () => {
    it('should call socialService.getFollowingIds', async () => {
      const result = await controller.getFollowingIds('u-005');
      expect(service.getFollowingIds).toHaveBeenCalledWith('u-005');
      expect(result).toEqual(['u-001']);
    });
  });
});
