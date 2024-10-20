import { Injectable, NotFoundException } from '@nestjs/common';
import { Cart, CartStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { UpsertItemDto } from './dto/upsert-item.dto';

@Injectable()
export class CartService {
  constructor(private readonly prismaService: PrismaService) {}

  async getActiveCart(userId?: number, sessionId?: string): Promise<Cart> {
    if (!userId && !sessionId) {
      throw new NotFoundException('Не найден пользователь или сессия');
    }

    let cart: Cart | null = null;

    if (userId) {
      cart = await this.prismaService.cart.findFirst({
        where: {
          user_id: userId,
          status: CartStatus.ACTIVE,
        },
        include: {
          cart_items: true,
        },
      });
    } else if (sessionId) {
      cart = await this.prismaService.cart.findFirst({
        where: {
          guest_session_id: sessionId,
          status: CartStatus.ACTIVE,
        },
        include: {
          cart_items: true,
        },
      });
    }

    if (!cart) {
      throw new NotFoundException('Активная корзина не найдена');
    }

    return cart;
  }

  async upsertItem(
    upsertItemDto: UpsertItemDto,
    userId?: number,
    sessionId?: string,
  ): Promise<void> {
    const cart = await this.getOrCreateActiveCart(userId, sessionId);

    const optionsArray = upsertItemDto.options.map((option) => ({
      priceType: option.priceType,
      quantity: option.quantity,
    }));

    const existingItem = await this.prismaService.cartItem.findFirst({
      where: {
        cart_id: cart.id,
        service_id: upsertItemDto.serviceId,
        service_type: upsertItemDto.serviceType,
        date: upsertItemDto.date,
        time: upsertItemDto.time,
      },
    });

    if (existingItem) {
      await this.prismaService.cartItem.update({
        where: { id: existingItem.id },
        data: {
          options: optionsArray,
        },
      });
    } else {
      await this.prismaService.cartItem.create({
        data: {
          cart_id: cart.id,
          service_id: upsertItemDto.serviceId,
          service_type: upsertItemDto.serviceType,
          date: upsertItemDto.date,
          time: upsertItemDto.time,
          options: optionsArray,
        },
      });
    }
  }

  async removeItem(
    itemId: number,
    userId?: number,
    sessionId?: string,
  ): Promise<void> {
    const cart = await this.getActiveCart(userId, sessionId);

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
    const cart = await this.getActiveCart(userId, sessionId);

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

  private async getOrCreateActiveCart(
    userId?: number,
    sessionId?: string,
  ): Promise<Cart> {
    let cart: Cart | null = null;

    if (userId) {
      cart = await this.prismaService.cart.findFirst({
        where: {
          user_id: userId,
          status: CartStatus.ACTIVE,
        },
      });

      if (!cart) {
        cart = await this.prismaService.cart.create({
          data: {
            user_id: userId,
            status: CartStatus.ACTIVE,
          },
        });
      }
    } else if (sessionId) {
      cart = await this.prismaService.cart.findFirst({
        where: {
          guest_session_id: sessionId,
          status: CartStatus.ACTIVE,
        },
      });

      if (!cart) {
        cart = await this.prismaService.cart.create({
          data: {
            guest_session_id: sessionId,
            status: CartStatus.ACTIVE,
          },
        });
      }
    } else {
      throw new Error('Не удалось идентифицировать корзину');
    }

    return cart;
  }
}
