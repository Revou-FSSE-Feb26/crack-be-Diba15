import { BadRequestException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { ArtworksRepository } from './artworks.repository';
import { ArtworksService } from './artworks.service';

describe('ArtworksService', () => {
  let service: ArtworksService;
  let artworksRepository: jest.Mocked<Partial<ArtworksRepository>>;

  const mockArtwork = {
    id: 'a-001',
    artistsId: 'u-001',
    title: 'Neon Samurai',
    description: 'Cyberpunk katana warrior in the rain.',
    imagesUrl: ['https://example.com/art1.jpg'],
    wipProofUrl: 'https://example.com/proof1.jpg',
    uploadType: 'single',
    curationStatus: 'approved',
    isVisibleOnFeed: true,
    rejectionReason: null,
    reviewedAt: new Date('2024-06-12T09:00:00Z'),
    reviewedBy: 'u-008',
    createdAt: new Date('2024-06-12T09:00:00Z'),
    updatedAt: new Date('2024-06-12T09:00:00Z'),
    artist: {
      id: 'u-001',
      name: 'Ari Ramadan',
      profile: {
        isVerified: true,
        isOpenForCommission: true,
        avatarUrl: null,
      },
    },
    tags: [
      {
        tag: {
          id: 't-001',
          tagName: 'cyberpunk',
        },
      },
    ],
  };

  beforeEach(async () => {
    artworksRepository = {
      findAll: jest.fn(),
      count: jest.fn(),
      findArtworkById: jest.fn(),
      findArtworkByIdRaw: jest.fn(),
      findProfileByUserId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      curate: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArtworksService,
        { provide: ArtworksRepository, useValue: artworksRepository },
      ],
    }).compile();

    service = module.get<ArtworksService>(ArtworksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return array of mapped artworks when no pagination is requested', async () => {
      (artworksRepository.findAll as jest.Mock).mockResolvedValue([mockArtwork]);

      const result = await service.findAll({});
      expect(Array.isArray(result)).toBe(true);
      expect((result as any[])[0].id).toBe('a-001');
      expect((result as any[])[0].artist.name).toBe('Ari Ramadan');
    });

    it('should return paginated data and meta when page and limit are provided', async () => {
      (artworksRepository.findAll as jest.Mock).mockResolvedValue([mockArtwork]);
      (artworksRepository.count as jest.Mock).mockResolvedValue(10);

      const result = await service.findAll({ page: 1, limit: 6 });
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect((result as any).data).toHaveLength(1);
      expect((result as any).meta.total).toBe(10);
      expect((result as any).meta.page).toBe(1);
      expect((result as any).meta.limit).toBe(6);
      expect((result as any).meta.total_pages).toBe(2);
      expect((result as any).meta.has_more).toBe(true);
    });
  });
});
