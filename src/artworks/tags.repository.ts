import { Injectable } from '@nestjs/common';
import type { TagsRepositoryInterface } from '../common/interfaces/tags.repository.interface';
import { PrismaService } from '../prisma/prisma.service';

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
      orderBy: { tagName: 'asc' },
    });
  }
}
