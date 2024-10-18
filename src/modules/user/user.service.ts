import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { email, password, firstName } = createUserDto;

    try {
      const hashedPassword = await this.encryptPassword(password);

      return await this.prisma.user.create({
        data: {
          email,
          first_name: firstName,
          password_hash: hashedPassword,
          is_active: true,
        },
        select: {
          id: true,
          email: true,
          first_name: true,
          is_active: true,
          phone_number: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Пользователь с таким email уже существует.',
          );
        }
      }
      this.logger.error(
        'Ошибка при создании пользователя',
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        'Произошла непредвиденная ошибка при создании пользователя.',
      );
    }
  }

  async getByEmailWithoutPassword(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        first_name: true,
        email: true,
        phone_number: true,
        is_active: true,
      },
    });
  }

  async getById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        first_name: true,
        email: true,
        phone_number: true,
        is_active: true,
      },
    });
  }

  async getByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        first_name: true,
        email: true,
        phone_number: true,
        is_active: true,
        password_hash: true,
      },
    });
  }

  private async encryptPassword(password: string): Promise<string> {
    const saltRounds = 10;
    try {
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      this.logger.error(
        `Ошибка при шифровании пароля`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('Не удалось зашифровать пароль.');
    }
  }
}
