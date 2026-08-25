import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { ArtworksService } from '../artworks/artworks.service';
import { UsersRepository } from '../users/users.repository';
import { FavoriteRepository } from './favorite.repository';
import { FollowRepository } from './follow.repository';
import { SocialService } from './social.service';

describe('SocialService', () => {
  let service: SocialService;
  let favoriteRepo: jest.Mocked<Partial<FavoriteRepository>>;
  let followRepo: jest.Mocked<Partial<FollowRepository>>;
  let artworksService: jest.Mocked<Partial<ArtworksService>>;
  let usersRepo: jest.Mocked<Partial<UsersRepository>>;

  const mockArtwork = {
    id: 'a-001',
    artists_id: 'u-001',
    title: 'Neon Samurai',
    description: 'Cyberpunk katana warrior in the rain.',
    images_url: ['https://example.com/art1.jpg'],
    wip_proof_url: 'https://example.com/proof1.jpg',
    upload_type: 'single',
    curation_status: 'approved',
    is_visible_on_feed: true,
    created_at: '2024-06-12T09:00:00.000Z',
    updated_at: '2024-06-12T09:00:00.000Z',
  };

  const mockArtist = {
    id: 'u-001',
    name: 'Ari Ramadan',
    email: 'ari@example.com',
    role: 'artist',
  };

  beforeEach(async () => {
    favoriteRepo = {
      findFavorite: jest.fn(),
      createFavorite: jest.fn(),
      deleteFavorite: jest.fn(),
      getUserFavorites: jest.fn().mockResolvedValue([mockArtwork]),
      getUserFavoriteArtworkIds: jest.fn().mockResolvedValue(['a-001']),
    };

    followRepo = {
      findFollow: jest.fn(),
      createFollow: jest.fn(),
      deleteFollow: jest.fn(),
      getUserFollowing: jest.fn().mockResolvedValue([mockArtist]),
      getUserFollowingArtistIds: jest.fn().mockResolvedValue(['u-001']),
    };

    artworksService = {
      findOne: jest.fn().mockResolvedValue(mockArtwork),
      mapToFrontendArtwork: jest.fn().mockImplementation((art) => art),
    };

    usersRepo = {
      findById: jest.fn().mockResolvedValue(mockArtist as any),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialService,
        { provide: FavoriteRepository, useValue: favoriteRepo },
        { provide: FollowRepository, useValue: followRepo },
        { provide: ArtworksService, useValue: artworksService },
        { provide: UsersRepository, useValue: usersRepo },
      ],
    }).compile();

    service = module.get<SocialService>(SocialService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('toggleFavorite', () => {
    it('should add to favorites if not already favorited', async () => {
      favoriteRepo.findFavorite.mockResolvedValue(null as any);
      const result = await service.toggleFavorite('u-005', 'a-001');

      expect(artworksService.findOne).toHaveBeenCalledWith('a-001');
      expect(favoriteRepo.createFavorite).toHaveBeenCalledWith('u-005', 'a-001');
      expect(result).toEqual({ isFavorited: true, message: 'Ditambahkan ke favorit.' });
    });

    it('should remove from favorites if already favorited', async () => {
      favoriteRepo.findFavorite.mockResolvedValue({ id: 'fav-1' } as any);
      const result = await service.toggleFavorite('u-005', 'a-001');

      expect(favoriteRepo.deleteFavorite).toHaveBeenCalledWith('u-005', 'a-001');
      expect(result).toEqual({ isFavorited: false, message: 'Dihapus dari favorit.' });
    });

    it('should throw NotFoundException if artwork does not exist', async () => {
      artworksService.findOne.mockResolvedValue(null as any);
      await expect(service.toggleFavorite('u-005', 'a-999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFavorites', () => {
    it('should return mapped favorites list', async () => {
      const result = await service.getFavorites('u-005');
      expect(favoriteRepo.getUserFavorites).toHaveBeenCalledWith('u-005');
      expect(result).toEqual([mockArtwork]);
    });
  });

  describe('getFavoriteIds', () => {
    it('should return favorite artwork ids', async () => {
      const result = await service.getFavoriteIds('u-005');
      expect(favoriteRepo.getUserFavoriteArtworkIds).toHaveBeenCalledWith('u-005');
      expect(result).toEqual(['a-001']);
    });
  });

  describe('toggleFollow', () => {
    it('should throw BadRequestException if user tries to follow themselves', async () => {
      await expect(service.toggleFollow('u-001', 'u-001')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if target artist does not exist', async () => {
      usersRepo.findById.mockResolvedValue(null as any);
      await expect(service.toggleFollow('u-005', 'u-999')).rejects.toThrow(NotFoundException);
    });

    it('should follow artist if not already followed', async () => {
      followRepo.findFollow.mockResolvedValue(null as any);
      const result = await service.toggleFollow('u-005', 'u-001');

      expect(followRepo.createFollow).toHaveBeenCalledWith('u-005', 'u-001');
      expect(result).toEqual({ isFollowing: true, message: 'Berhasil mengikuti artis.' });
    });

    it('should unfollow artist if already followed', async () => {
      followRepo.findFollow.mockResolvedValue({ id: 'fol-1' } as any);
      const result = await service.toggleFollow('u-005', 'u-001');

      expect(followRepo.deleteFollow).toHaveBeenCalledWith('u-005', 'u-001');
      expect(result).toEqual({ isFollowing: false, message: 'Berhenti mengikuti.' });
    });
  });

  describe('getFollowing', () => {
    it('should return following list', async () => {
      const result = await service.getFollowing('u-005');
      expect(followRepo.getUserFollowing).toHaveBeenCalledWith('u-005');
      expect(result).toEqual([mockArtist]);
    });
  });

  describe('getFollowingIds', () => {
    it('should return following ids', async () => {
      const result = await service.getFollowingIds('u-005');
      expect(followRepo.getUserFollowingArtistIds).toHaveBeenCalledWith('u-005');
      expect(result).toEqual(['u-001']);
    });
  });
});
