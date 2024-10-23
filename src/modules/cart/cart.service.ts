import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CartStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { CartResponse } from './response/cart.response';

@Injectable()
export class CartService {
  private readonly selectFields = {
    id: true,
    status: true,
    user_id: true,
    guest_session_id: true,
    cart_items: {
      select: {
        id: true,
        service_id: true,
        service_type: true,
        date: true,
        time: true,
        options: true,
      },
    },
  } as const;

  constructor(private readonly prismaService: PrismaService) {}

  async addItem(
    addItemDto: AddItemDto,
    userId?: number,
    sessionId?: string,
  ): Promise<void> {
    const cart = await this.getOrCreateActiveCart(userId, sessionId);

    const optionsArray = addItemDto.options.map((option) => ({
      priceType: option.priceType,
      quantity: option.quantity,
    }));

    await this.prismaService.cartItem.create({
      data: {
        cart_id: cart.id,
        service_id: addItemDto.serviceId,
        service_type: addItemDto.serviceType,
        date: addItemDto.date,
        time: addItemDto.time,
        options: optionsArray,
      },
    });
  }

  async updateItem(
    cartItemId: number,
    updateItemDto: UpdateItemDto,
    userId?: number,
    sessionId?: string,
  ): Promise<void> {
    const cart = await this.getOrCreateActiveCart(userId, sessionId);

    const existingItem = await this.prismaService.cartItem.findFirst({
      where: {
        id: cartItemId,
        cart_id: cart.id,
      },
    });

    if (!existingItem) {
      throw new NotFoundException('Элемент корзины не найден');
    }

    const duplicateItem = await this.prismaService.cartItem.findFirst({
      where: {
        cart_id: cart.id,
        service_id: updateItemDto.serviceId,
        service_type: updateItemDto.serviceType,
        date: updateItemDto.date,
        time: updateItemDto.time,
        NOT: {
          id: cartItemId,
        },
      },
    });

    if (duplicateItem) {
      throw new ConflictException(
        'Элемент с такими параметрами уже существует в корзине',
      );
    }

    const optionsArray = updateItemDto.options.map((option) => ({
      priceType: option.priceType,
      quantity: option.quantity,
    }));

    try {
      await this.prismaService.cartItem.update({
        where: { id: cartItemId },
        data: {
          service_id: updateItemDto.serviceId,
          service_type: updateItemDto.serviceType,
          date: updateItemDto.date,
          time: updateItemDto.time,
          options: optionsArray,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Невозможно обновить элемент корзины. Возможно, такой элемент уже существует.',
          );
        }
      }
      console.error('Ошибка при обновлении элемента корзины:', error);
      throw new InternalServerErrorException(
        'Произошла ошибка при обновлении элемента корзины',
      );
    }
  }

  async removeItem(
    itemId: number,
    userId?: number,
    sessionId?: string,
  ): Promise<void> {
    const cart = await this.getOrCreateActiveCart(userId, sessionId);

    const cartItem = await this.prismaService.cartItem.findFirst({
      where: {
        id: itemId,
        cart_id: cart.id,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Элемент корзины не найден');
    }

    await this.prismaService.cartItem.delete({
      where: { id: cartItem.id },
    });
  }

  async clearCart(userId?: number, sessionId?: string): Promise<void> {
    const cart = await this.getOrCreateActiveCart(userId, sessionId);

    await this.prismaService.cartItem.deleteMany({
      where: {
        cart_id: cart.id,
      },
    });
  }

  async mergeCarts(userId: number, sessionId: string): Promise<void> {
    const guestCart = await this.prismaService.cart.findFirst({
      where: {
        guest_session_id: sessionId,
        status: CartStatus.ACTIVE,
      },
      include: {
        cart_items: true,
      },
    });

    if (!guestCart) {
      return;
    }

    const userCart = await this.prismaService.cart.findFirst({
      where: {
        user_id: userId,
        status: CartStatus.ACTIVE,
      },
      include: {
        cart_items: true,
      },
    });

    if (!userCart) {
      await this.prismaService.cart.update({
        where: { id: guestCart.id },
        data: {
          user_id: userId,
          guest_session_id: null,
        },
      });
    } else {
      for (const guestItem of guestCart.cart_items) {
        const existingItem = userCart.cart_items.find(
          (item) =>
            item.service_id === guestItem.service_id &&
            item.service_type === guestItem.service_type &&
            item.date.getTime() === guestItem.date.getTime() &&
            item.time === guestItem.time,
        );

        if (existingItem) {
          await this.prismaService.cartItem.update({
            where: { id: existingItem.id },
            data: {
              options: guestItem.options,
            },
          });
        } else {
          await this.prismaService.cartItem.create({
            data: {
              cart_id: userCart.id,
              service_id: guestItem.service_id,
              service_type: guestItem.service_type,
              date: guestItem.date,
              time: guestItem.time,
              options: guestItem.options,
            },
          });
        }
      }

      await this.prismaService.cart.delete({ where: { id: guestCart.id } });
    }
  }

  async getOrCreateActiveCart(
    userId?: number,
    sessionId?: string,
  ): Promise<CartResponse> {
    if (!userId && !sessionId) {
      throw new Error('Не найден пользователь или сессия');
    }
    let cart: CartResponse | null = null;

    if (userId) {
      cart = await this.prismaService.cart.findFirst({
        where: {
          user_id: userId,
          status: CartStatus.ACTIVE,
        },
        select: this.selectFields,
      });

      if (!cart) {
        cart = await this.prismaService.cart.create({
          data: {
            user_id: userId,
            status: CartStatus.ACTIVE,
          },
          select: this.selectFields,
        });
      }
    } else if (sessionId) {
      cart = await this.prismaService.cart.findFirst({
        where: {
          guest_session_id: sessionId,
          status: CartStatus.ACTIVE,
        },
        select: this.selectFields,
      });

      if (!cart) {
        cart = await this.prismaService.cart.create({
          data: {
            guest_session_id: sessionId,
            status: CartStatus.ACTIVE,
          },
          select: this.selectFields,
        });
      }
    }

    return cart;
  }
}
