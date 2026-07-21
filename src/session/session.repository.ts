import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(data: { userId: string; refreshToken: string; userAgent?: string }) {
    return this.prisma.session.create({
      data: {
        userId: data.userId,
        refreshToken: data.refreshToken,
        userAgent: data.userAgent || null,
      },
    });
  }

  async findSessionsByUserId(userId: string) {
    return this.prisma.session.findMany({
      where: { userId },
    });
  }

  async updateSessionToken(sessionId: string, newHashedToken: string) {
    return this.prisma.session.update({
      where: { id: sessionId },
      data: { refreshToken: newHashedToken },
    });
  }

  async deleteSession(sessionId: string) {
    return this.prisma.session.delete({
      where: { id: sessionId },
    });
  }

  async deleteAllUserSessions(userId: string) {
    return this.prisma.session.deleteMany({
      where: { userId },
    });
  }
}
