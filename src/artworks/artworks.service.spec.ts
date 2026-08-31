import { Test, type TestingModule } from '@nestjs/testing';
import { ArtistsRepository } from './artists.repository';
import { ArtworksRepository } from './artworks.repository';
import { ArtworksService } from './artworks.service';
import { TagsRepository } from './tags.repository';

describe('ArtworksService', () => {
  let service: ArtworksService;
  let artworksRepository: jest.Mocked<Partial<ArtworksRepository>>;
  let tagsRepository: jest.Mocked<Partial<TagsRepository>>;
  let artistsRepository: jest.Mocked<Partial<ArtistsRepository>>;

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

  const mockArtist = {
    id: 'u-001',
    name: 'Ari Ramadan',
    email: 'ari@example.com',
    role: 'artist',
    profile: {
      avatarUrl: null,
      bio: 'Digital illustrator',
      instagramUrl: null,
      twitterUrl: null,
      pixivUrl: null,
      websiteUrl: null,
      isVerified: true,
      isOpenForCommission: true,
      basePriceIdr: 450000,
      approvedPortfolioCount: 6,
    },
    _count: {
      followers: 10,
    },
    createdAt: new Date('2024-06-12T09:00:00Z'),
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
      delete: jest.fn(),
    };

    tagsRepository = {
      getPopularTags: jest.fn(),
      findAllTags: jest.fn(),
      findTagById: jest.fn(),
      findTagByName: jest.fn(),
      createTag: jest.fn(),
      updateTag: jest.fn(),
      deleteTag: jest.fn(),
    };

    artistsRepository = {
      findAllArtists: jest.fn(),
      findArtistById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArtworksService,
        { provide: ArtworksRepository, useValue: artworksRepository },
        { provide: TagsRepository, useValue: tagsRepository },
        { provide: ArtistsRepository, useValue: artistsRepository },
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

  describe('tags and artists delegation', () => {
    it('should get popular tags from tagsRepository', async () => {
      (tagsRepository.getPopularTags as jest.Mock).mockResolvedValue([
        { id: 't-001', tag_name: 'cyberpunk', count: 5 },
      ]);

      const tags = await service.getPopularTags();
      expect(tags).toHaveLength(1);
      expect(tags[0].tag_name).toBe('cyberpunk');
    });

    it('should find all tags with count from tagsRepository', async () => {
      (tagsRepository.findAllTags as jest.Mock).mockResolvedValue([
        {
          id: 't-001',
          tagName: 'cyberpunk',
          _count: { artworks: 3 },
        },
      ]);

      const tags = await service.findAllTags();
      expect(tags).toHaveLength(1);
      expect(tags[0].tag_name).toBe('cyberpunk');
      expect(tags[0].count).toBe(3);
    });

    it('should create new tag successfully', async () => {
      (tagsRepository.findTagByName as jest.Mock).mockResolvedValue(null);
      (tagsRepository.createTag as jest.Mock).mockResolvedValue({
        id: 't-002',
        tagName: 'watercolor',
        _count: { artworks: 0 },
      });

      const created = await service.createTag({ tagName: 'Watercolor ' });
      expect(created.id).toBe('t-002');
      expect(created.tag_name).toBe('watercolor');
      expect(tagsRepository.createTag).toHaveBeenCalledWith('watercolor');
    });

    it('should update tag successfully', async () => {
      (tagsRepository.findTagById as jest.Mock).mockResolvedValue({
        id: 't-001',
        tagName: 'cyberpunk',
      });
      (tagsRepository.findTagByName as jest.Mock).mockResolvedValue(null);
      (tagsRepository.updateTag as jest.Mock).mockResolvedValue({
        id: 't-001',
        tagName: 'cyberpunk-city',
        _count: { artworks: 3 },
      });

      const updated = await service.updateTag('t-001', { tagName: 'cyberpunk-city' });
      expect(updated.tag_name).toBe('cyberpunk-city');
    });

    it('should delete tag successfully', async () => {
      (tagsRepository.findTagById as jest.Mock).mockResolvedValue({
        id: 't-001',
        tagName: 'cyberpunk',
      });
      (tagsRepository.deleteTag as jest.Mock).mockResolvedValue({});

      const res = await service.deleteTag('t-001');
      expect(res.message).toContain('berhasil dihapus');
    });

    it('should find all artists from artistsRepository', async () => {
      (artistsRepository.findAllArtists as jest.Mock).mockResolvedValue([mockArtist]);

      const artists = await service.findAllArtists();
      expect(artists).toHaveLength(1);
      expect(artists[0].id).toBe('u-001');
    });

    it('should find artist by id with created_at included', async () => {
      (artistsRepository.findArtistById as jest.Mock).mockResolvedValue(mockArtist);

      const artist = await service.findArtistById('u-001');
      expect(artist.id).toBe('u-001');
      expect(artist.created_at).toEqual(new Date('2024-06-12T09:00:00Z'));
      expect(artist.user.name).toBe('Ari Ramadan');
    });
  });
});
