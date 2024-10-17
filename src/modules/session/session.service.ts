import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async createSession(
    userId: number,
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const sessionExpiry = this.configService.get<number>('sessionExpiryDays');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + sessionExpiry);

    return this.prismaService.session.create({
      data: {
        user_id: userId,
        refresh_token: this.hashToken(refreshToken),
        ip_address: ipAddress,
        user_agent: userAgent,
        expires_at: expiresAt,
      },
    });
  }

  async updateSession(oldRefreshToken: string, newRefreshToken: string) {
    const sessionExpiry = this.configService.get<number>('sessionExpiryDays');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + sessionExpiry);

    try {
      return await this.prismaService.session.update({
        where: { refresh_token: this.hashToken(oldRefreshToken) },
        data: {
          refresh_token: this.hashToken(newRefreshToken),
          updated_at: new Date(),
          expires_at: expiresAt,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Сессия не найдена');
        }
      }
      throw error;
    }
  }

  async invalidateSession(refreshToken: string) {
    const session = await this.prismaService.session.update({
      where: {
        refresh_token: this.hashToken(refreshToken),
      },
      data: {
        is_active: false,
      },
    });

    if (!session) {
      throw new NotFoundException('Сессия не найдена');
    }

    return session;
  }

  async getActiveSessionByRefreshToken(refreshToken: string) {
    return this.prismaService.session.findFirst({
      where: {
        refresh_token: this.hashToken(refreshToken),
        is_active: true,
        expires_at: { gt: new Date() },
      },
    });
  }

  async getSessionByRefreshToken(refreshToken: string) {
    return this.prismaService.session.findFirst({
      where: {
        refresh_token: this.hashToken(refreshToken),
        expires_at: { gt: new Date() },
      },
    });
  }
}
