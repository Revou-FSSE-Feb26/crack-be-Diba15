import { Injectable } from '@nestjs/common';
import type { TagsRepositoryInterface } from '../common/interfaces/tags.repository.interface';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Class Repository untuk handle logic data tags
 * Meng-implementasi dari interface TagsRepositoryInterface
 *
 */
@Injectable()
export class TagsRepository implements TagsRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async getPopularTags() {
    const tagsCount = await this.prisma.artworkTag.groupBy({
      by: ['tagId'],
      _count: {
        artworkId: true,
      },
      orderBy: {
        _count: {
          artworkId: 'desc',
        },
      },
      take: 10,
    });

    if (tagsCount.length === 0) return [];

    const tagIds = tagsCount.map((item) => item.tagId);
    const tags = await this.prisma.tag.findMany({
      where: { id: { in: tagIds } },
    });

    const tagMap = new Map(tags.map((t) => [t.id, t.tagName]));

    return tagsCount
      .filter((item) => tagMap.has(item.tagId))
      .map((item) => ({
        id: item.tagId,
        tag_name: tagMap.get(item.tagId),
        count: item._count.artworkId,
      }));
  }

  async findAllTags() {
    return this.prisma.tag.findMany({
      include: {
        _count: {
          select: {
            artworks: true,
          },
        },
      },
      orderBy: { tagName: 'asc' },
    });
  }

  async findTagById(id: string) {
    return this.prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            artworks: true,
          },
        },
      },
    });
  }

  async findTagByName(name: string) {
    return this.prisma.tag.findUnique({
      where: { tagName: name },
    });
  }

  async createTag(name: string) {
    return this.prisma.tag.create({
      data: { tagName: name },
      include: {
        _count: {
          select: {
            artworks: true,
          },
        },
      },
    });
  }

  async updateTag(id: string, name: string) {
    return this.prisma.tag.update({
      where: { id },
      data: { tagName: name },
      include: {
        _count: {
          select: {
            artworks: true,
          },
        },
      },
    });
  }

  async deleteTag(id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.artworkTag.deleteMany({
        where: { tagId: id },
      });
      return tx.tag.delete({
        where: { id },
      });
    });
  }
}
