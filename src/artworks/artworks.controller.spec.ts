import { Test, type TestingModule } from '@nestjs/testing';
import { ArtworksController } from './artworks.controller';
import { ArtworksService } from './artworks.service';
import type { CreateArtworkDto } from './dto/create-artwork.dto';
import type { CreateTagDto } from './dto/create-tag.dto';
import type { CurateArtworkDto } from './dto/curate-artwork.dto';
import type { UpdateArtworkDto } from './dto/update-artwork.dto';
import type { UpdateTagDto } from './dto/update-tag.dto';

describe('ArtworksController', () => {
  let controller: ArtworksController;
  let service: jest.Mocked<Partial<ArtworksService>>;

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

  const mockTag = {
    id: 't-001',
    tag_name: 'cyberpunk',
    count: 10,
  };

  beforeEach(async () => {
    service = {
      findAll: jest.fn().mockResolvedValue([mockArtwork]),
      findOne: jest.fn().mockResolvedValue(mockArtwork),
      getPopularTags: jest.fn().mockResolvedValue([mockTag]),
      findPopularArtists: jest.fn().mockResolvedValue([mockArtist]),
      findAllArtists: jest.fn().mockResolvedValue([mockArtist]),
      findArtistById: jest.fn().mockResolvedValue(mockArtist),
      findAllTags: jest.fn().mockResolvedValue([mockTag]),
      createTag: jest.fn().mockResolvedValue(mockTag),
      updateTag: jest.fn().mockResolvedValue({ ...mockTag, tag_name: 'cyberpunk-2077' }),
      deleteTag: jest.fn().mockResolvedValue({ message: 'Tag "cyberpunk" berhasil dihapus.' }),
      create: jest.fn().mockResolvedValue(mockArtwork),
      update: jest.fn().mockResolvedValue({ ...mockArtwork, title: 'Updated Title' }),
      curate: jest.fn().mockResolvedValue({ ...mockArtwork, curation_status: 'approved' }),
      remove: jest.fn().mockResolvedValue({ message: 'Artwork berhasil dihapus.' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArtworksController],
      providers: [{ provide: ArtworksService, useValue: service }],
    }).compile();

    controller = module.get<ArtworksController>(ArtworksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call artworksService.findAll with parsed params', async () => {
      const result = await controller.findAll(
        'neon',
        'cyberpunk',
        'u-001',
        'approved',
        'true',
        '1',
        '10',
      );
      expect(service.findAll).toHaveBeenCalledWith({
        search: 'neon',
        tag: 'cyberpunk',
        artistId: 'u-001',
        curationStatus: 'approved',
        isVisibleOnFeed: 'true',
        page: 1,
        limit: 10,
      });
      expect(result).toEqual([mockArtwork]);
    });
  });

  describe('getPopularTags', () => {
    it('should return popular tags', async () => {
      const result = await controller.getPopularTags();
      expect(service.getPopularTags).toHaveBeenCalled();
      expect(result).toEqual([mockTag]);
    });
  });

  describe('findPopularArtists', () => {
    it('should return popular artists', async () => {
      const result = await controller.findPopularArtists();
      expect(service.findPopularArtists).toHaveBeenCalled();
      expect(result).toEqual([mockArtist]);
    });
  });

  describe('findAllArtists', () => {
    it('should return all artists', async () => {
      const result = await controller.findAllArtists();
      expect(service.findAllArtists).toHaveBeenCalled();
      expect(result).toEqual([mockArtist]);
    });
  });

  describe('findArtistById', () => {
    it('should return artist by id', async () => {
      const result = await controller.findArtistById('u-001');
      expect(service.findArtistById).toHaveBeenCalledWith('u-001');
      expect(result).toEqual(mockArtist);
    });
  });

  describe('tags management', () => {
    it('should return all tags with count', async () => {
      const result = await controller.findAllTags();
      expect(service.findAllTags).toHaveBeenCalled();
      expect(result).toEqual([mockTag]);
    });

    it('should create new tag', async () => {
      const dto: CreateTagDto = { tagName: 'cyberpunk' };
      const result = await controller.createTag(dto);
      expect(service.createTag).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockTag);
    });

    it('should update tag', async () => {
      const dto: UpdateTagDto = { tagName: 'cyberpunk-2077' };
      const result = await controller.updateTag('t-001', dto);
      expect(service.updateTag).toHaveBeenCalledWith('t-001', dto);
      expect(result).toEqual({ ...mockTag, tag_name: 'cyberpunk-2077' });
    });

    it('should delete tag', async () => {
      const result = await controller.deleteTag('t-001');
      expect(service.deleteTag).toHaveBeenCalledWith('t-001');
      expect(result).toEqual({ message: 'Tag "cyberpunk" berhasil dihapus.' });
    });
  });

  describe('findOne', () => {
    it('should return single artwork', async () => {
      const result = await controller.findOne('a-001');
      expect(service.findOne).toHaveBeenCalledWith('a-001');
      expect(result).toEqual(mockArtwork);
    });
  });

  describe('create', () => {
    it('should call artworksService.create', async () => {
      const dto: CreateArtworkDto = {
        title: 'Neon Samurai',
        description: 'Cyberpunk katana warrior in the rain.',
        imagesUrl: ['https://example.com/art1.jpg'],
        wipProofUrl: 'https://example.com/proof1.jpg',
        uploadType: 'single',
        requestCuration: false,
        tags: ['cyberpunk'],
      };
      const result = await controller.create('u-001', dto);
      expect(service.create).toHaveBeenCalledWith('u-001', dto);
      expect(result).toEqual(mockArtwork);
    });
  });

  describe('update', () => {
    it('should call artworksService.update', async () => {
      const dto: UpdateArtworkDto = { title: 'Updated Title' };
      const requester = { sub: 'u-001', email: 'ari@example.com', role: 'artist' };
      const result = await controller.update('a-001', requester, dto);
      expect(service.update).toHaveBeenCalledWith('a-001', 'u-001', 'artist', dto);
      expect(result).toEqual({ ...mockArtwork, title: 'Updated Title' });
    });
  });

  describe('curate', () => {
    it('should call artworksService.curate', async () => {
      const dto: CurateArtworkDto = { action: 'approve' };
      const result = await controller.curate('a-001', 'u-008', dto);
      expect(service.curate).toHaveBeenCalledWith('a-001', 'u-008', dto);
      expect(result).toEqual({ ...mockArtwork, curation_status: 'approved' });
    });
  });

  describe('remove', () => {
    it('should call artworksService.remove', async () => {
      const requester = { sub: 'u-001', email: 'ari@example.com', role: 'artist' };
      const result = await controller.remove('a-001', requester);
      expect(service.remove).toHaveBeenCalledWith('a-001', 'u-001', 'artist');
      expect(result).toEqual({ message: 'Artwork berhasil dihapus.' });
    });
  });
});
