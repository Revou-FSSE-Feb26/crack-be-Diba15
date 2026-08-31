import { BadRequestException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { CommissionsRepository } from '../commissions/commissions.repository';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

describe('UploadController', () => {
  let controller: UploadController;
  let uploadService: jest.Mocked<Partial<UploadService>>;
  let commissionsRepo: jest.Mocked<Partial<CommissionsRepository>>;

  const mockFile = {
    fieldname: 'file',
    originalname: 'image.png',
    mimetype: 'image/png',
    buffer: Buffer.from('test'),
    size: 1024,
  } as Express.Multer.File;

  beforeEach(async () => {
    uploadService = {
      handleAvatarUpload: jest.fn().mockResolvedValue({ url: 'https://example.com/avatar.png' }),
      handleCommissionSketchUpload: jest
        .fn()
        .mockResolvedValue({ url: 'https://example.com/sketch.png' }),
      handleCommissionPreviewUpload: jest
        .fn()
        .mockResolvedValue({ url: 'https://example.com/preview.png' }),
      handleCommissionFinalUpload: jest
        .fn()
        .mockResolvedValue({ url: 'https://example.com/final.zip' }),
      handleCommissionWipUpload: jest
        .fn()
        .mockResolvedValue({ urls: ['https://example.com/wip.png'] }),
      uploadFile: jest.fn().mockResolvedValue('https://example.com/file.png'),
    };

    commissionsRepo = {
      updateProgress: jest.fn().mockResolvedValue({} as any),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [
        { provide: UploadService, useValue: uploadService },
        { provide: CommissionsRepository, useValue: commissionsRepo },
      ],
    }).compile();

    controller = module.get<UploadController>(UploadController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadAvatar', () => {
    it('should upload avatar file', async () => {
      const result = await controller.uploadAvatar(mockFile, 'u-001');
      expect(uploadService.handleAvatarUpload).toHaveBeenCalledWith('u-001', mockFile);
      expect(result).toEqual({ url: 'https://example.com/avatar.png' });
    });

    it('should throw BadRequestException if file is missing', async () => {
      await expect(controller.uploadAvatar(null as any, 'u-001')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if file size exceeds 5MB', async () => {
      const largeFile = { ...mockFile, size: 6 * 1024 * 1024 } as Express.Multer.File;
      await expect(controller.uploadAvatar(largeFile, 'u-001')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if file mime is invalid', async () => {
      const invalidFile = { ...mockFile, mimetype: 'application/pdf' } as Express.Multer.File;
      await expect(controller.uploadAvatar(invalidFile, 'u-001')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('uploadMultiple', () => {
    it('should upload multiple files', async () => {
      const result = await controller.uploadMultiple([mockFile], 'artworks');
      expect(uploadService.uploadFile).toHaveBeenCalledWith(mockFile, 'artworks');
      expect(result).toEqual({ urls: ['https://example.com/file.png'] });
    });

    it('should throw BadRequestException if no files provided', async () => {
      await expect(controller.uploadMultiple([], 'artworks')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if more than 5 files provided', async () => {
      const manyFiles = [mockFile, mockFile, mockFile, mockFile, mockFile, mockFile];
      await expect(controller.uploadMultiple(manyFiles, 'artworks')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if folder is invalid', async () => {
      await expect(controller.uploadMultiple([mockFile], 'invalid_folder')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('uploadCommissionWip', () => {
    it('should upload commission wip files', async () => {
      const result = await controller.uploadCommissionWip([mockFile], 'c-001');
      expect(uploadService.handleCommissionWipUpload).toHaveBeenCalledWith('c-001', [mockFile]);
      expect(result).toEqual({ urls: ['https://example.com/wip.png'] });
    });

    it('should throw BadRequestException if no wip files provided', async () => {
      await expect(controller.uploadCommissionWip([], 'c-001')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('uploadCommissionSketch', () => {
    it('should upload commission sketch file', async () => {
      const result = await controller.uploadCommissionSketch(mockFile, 'c-001');
      expect(uploadService.handleCommissionSketchUpload).toHaveBeenCalledWith('c-001', mockFile);
      expect(result).toEqual({ url: 'https://example.com/sketch.png' });
    });

    it('should throw BadRequestException if sketch file missing', async () => {
      await expect(controller.uploadCommissionSketch(null as any, 'c-001')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('uploadCommissionPreview', () => {
    it('should upload commission preview file', async () => {
      const result = await controller.uploadCommissionPreview(mockFile, 'c-001');
      expect(uploadService.handleCommissionPreviewUpload).toHaveBeenCalledWith('c-001', mockFile);
      expect(result).toEqual({ url: 'https://example.com/preview.png' });
    });

    it('should throw BadRequestException if preview file missing', async () => {
      await expect(controller.uploadCommissionPreview(null as any, 'c-001')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('uploadCommissionFinal', () => {
    it('should upload commission final archive', async () => {
      const result = await controller.uploadCommissionFinal(mockFile, 'c-001');
      expect(uploadService.handleCommissionFinalUpload).toHaveBeenCalledWith('c-001', mockFile);
      expect(commissionsRepo.updateProgress).toHaveBeenCalledWith('c-001', {
        final_file_url: 'https://example.com/final.zip',
      });
      expect(result).toEqual({ url: 'https://example.com/final.zip' });
    });

    it('should throw BadRequestException if final file missing', async () => {
      await expect(controller.uploadCommissionFinal(null as any, 'c-001')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
