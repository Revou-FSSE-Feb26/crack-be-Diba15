import { Test, type TestingModule } from '@nestjs/testing';
import { CommissionsRepository } from '../commissions/commissions.repository';
import { ProfilesRepository } from '../profiles/profiles.repository';
import { UploadService } from './upload.service';

describe('UploadService', () => {
  let service: UploadService;
  let profileRepo: jest.Mocked<Partial<ProfilesRepository>>;
  let commissionsRepo: jest.Mocked<Partial<CommissionsRepository>>;

  const mockFile = {
    fieldname: 'file',
    originalname: 'avatar.png',
    encoding: '7bit',
    mimetype: 'image/png',
    buffer: Buffer.from('mock content'),
    size: 1024,
  } as Express.Multer.File;

  beforeEach(async () => {
    process.env.SUPABASE_URL = 'https://supabase.mock';
    process.env.SUPABASE_KEY = 'mock-key';
    process.env.SUPABASE_BUCKET = 'trubrush';

    profileRepo = {
      findByUserId: jest.fn().mockResolvedValue({
        userId: 'u-001',
        avatarUrl: 'https://supabase.mock/storage/v1/object/public/trubrush/avatars/old-avatar.png',
      } as any),
      updateAvatarUrl: jest.fn().mockResolvedValue({} as any),
    };

    commissionsRepo = {
      findCommissionProgress: jest.fn().mockResolvedValue({
        id: 'cp-001',
        commissionId: 'c-001',
        sketchUrl:
          'https://supabase.mock/storage/v1/object/public/trubrush/commissions/c-001/sketch/old-sketch.png',
        finalArtworkUrl:
          'https://supabase.mock/storage/v1/object/public/trubrush/commissions/c-001/preview/old-preview.png',
        finalFileUrl:
          'https://supabase.mock/storage/v1/object/public/trubrush/commissions/c-001/final/old-final.zip',
      } as any),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        { provide: ProfilesRepository, useValue: profileRepo },
        { provide: CommissionsRepository, useValue: commissionsRepo },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);

    jest
      .spyOn(service, 'uploadFile')
      .mockResolvedValue('https://supabase.mock/storage/v1/object/public/trubrush/uploaded.png');
    jest.spyOn(service, 'deleteFile').mockResolvedValue();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleAvatarUpload', () => {
    it('should delete old avatar and update new avatar url', async () => {
      const result = await service.handleAvatarUpload('u-001', mockFile);

      expect(profileRepo.findByUserId).toHaveBeenCalledWith('u-001');
      expect(service.deleteFile).toHaveBeenCalledWith('avatars/old-avatar.png');
      expect(service.uploadFile).toHaveBeenCalledWith(mockFile, 'avatars', 'avatar-u-001');
      expect(profileRepo.updateAvatarUrl).toHaveBeenCalledWith(
        'u-001',
        'https://supabase.mock/storage/v1/object/public/trubrush/uploaded.png',
      );
      expect(result).toEqual({
        url: 'https://supabase.mock/storage/v1/object/public/trubrush/uploaded.png',
      });
    });
  });

  describe('handleCommissionSketchUpload', () => {
    it('should delete old sketch and upload new sketch', async () => {
      const result = await service.handleCommissionSketchUpload('c-001', mockFile);

      expect(commissionsRepo.findCommissionProgress).toHaveBeenCalledWith('c-001');
      expect(service.deleteFile).toHaveBeenCalledWith('commissions/c-001/sketch/old-sketch.png');
      expect(service.uploadFile).toHaveBeenCalledWith(mockFile, 'commissions/c-001/sketch');
      expect(result).toEqual({
        url: 'https://supabase.mock/storage/v1/object/public/trubrush/uploaded.png',
      });
    });
  });

  describe('handleCommissionPreviewUpload', () => {
    it('should delete old preview and upload new preview', async () => {
      const result = await service.handleCommissionPreviewUpload('c-001', mockFile);

      expect(commissionsRepo.findCommissionProgress).toHaveBeenCalledWith('c-001');
      expect(service.deleteFile).toHaveBeenCalledWith('commissions/c-001/preview/old-preview.png');
      expect(service.uploadFile).toHaveBeenCalledWith(mockFile, 'commissions/c-001/preview');
      expect(result).toEqual({
        url: 'https://supabase.mock/storage/v1/object/public/trubrush/uploaded.png',
      });
    });
  });

  describe('handleCommissionFinalUpload', () => {
    it('should delete old final archive and upload new final archive', async () => {
      const result = await service.handleCommissionFinalUpload('c-001', mockFile);

      expect(commissionsRepo.findCommissionProgress).toHaveBeenCalledWith('c-001');
      expect(service.deleteFile).toHaveBeenCalledWith('commissions/c-001/final/old-final.zip');
      expect(service.uploadFile).toHaveBeenCalledWith(mockFile, 'commissions/c-001/final');
      expect(result).toEqual({
        url: 'https://supabase.mock/storage/v1/object/public/trubrush/uploaded.png',
      });
    });
  });

  describe('handleCommissionWipUpload', () => {
    it('should upload multiple wip files', async () => {
      const result = await service.handleCommissionWipUpload('c-001', [mockFile, mockFile]);

      expect(service.uploadFile).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        urls: [
          'https://supabase.mock/storage/v1/object/public/trubrush/uploaded.png',
          'https://supabase.mock/storage/v1/object/public/trubrush/uploaded.png',
        ],
      });
    });
  });
});
