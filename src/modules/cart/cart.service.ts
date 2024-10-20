import { Injectable, NotFoundException } from '@nestjs/common';
import { Cart, CartStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

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
          cart_items: {
            include: {
              cart_item_options: true,
            },
          },
        },
      });
    } else if (sessionId) {
      cart = await this.prismaService.cart.findFirst({
        where: {
          guest_session_id: sessionId,
          status: CartStatus.ACTIVE,
        },
        include: {
          cart_items: {
            include: {
              cart_item_options: true,
            },
          },
        },
      });
    }

    if (!cart) {
      throw new NotFoundException('Активная корзина не найдена');
    }

    return cart;
  }

  async addItem(
    addItemDto: AddItemDto,
    userId?: number,
    sessionId?: string,
  ): Promise<void> {
    const cart = await this.getOrCreateActiveCart(userId, sessionId);

    const existingItem = await this.prismaService.cartItem.findFirst({
      where: {
        cart_id: cart.id,
        service_id: addItemDto.serviceId,
        service_type: addItemDto.serviceType,
        date: addItemDto.date,
        time: addItemDto.time,
      },
    });

    if (existingItem) {
      await this.updateCartItemOptions(
        existingItem.id,
        addItemDto.options,
        true,
      );
    } else {
      await this.prismaService.cartItem.create({
        data: {
          cart: {
            connect: {
              id: cart.id,
            },
          },
          service_id: addItemDto.serviceId,
          service_type: addItemDto.serviceType,
          date: addItemDto.date,
          time: addItemDto.time,
          cart_item_options: {
            create: addItemDto.options.map((option) => ({
              price_type: option.priceType,
              quantity: option.quantity,
            })),
          },
        },
      });
    }
  }

  async updateItem(
    itemId: number,
    updateItemDto: UpdateItemDto,
    userId?: number,
    sessionId?: string,
  ): Promise<void> {
    const cart = await this.getActiveCart(userId, sessionId);

    const cartItem = await this.prismaService.cartItem.findFirst({
      where: {
        id: itemId,
        cart_id: cart.id,
      },
      include: {
        cart_item_options: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Элемент корзины не найден');
    }

    const existingOptions = cartItem.cart_item_options;
    const newOptions = updateItemDto.options;

    const optionsToUpdate = [];
    const optionsToCreate = [];
    const optionsToDeleteIds = existingOptions
      .filter((eo) => !newOptions.some((no) => no.priceType === eo.price_type))
      .map((eo) => eo.id);

    for (const option of newOptions) {
      const existingOption = existingOptions.find(
        (eo) => eo.price_type === option.priceType,
      );

      if (existingOption) {
        optionsToUpdate.push(
          this.prismaService.cartItemOption.update({
            where: { id: existingOption.id },
            data: { quantity: option.quantity },
          }),
        );
      } else {
        optionsToCreate.push({
          cart_item_id: cartItem.id,
          price_type: option.priceType,
          quantity: option.quantity,
        });
      }
    }

    await this.prismaService.$transaction([
      this.prismaService.cartItemOption.deleteMany({
        where: { id: { in: optionsToDeleteIds } },
      }),
      ...optionsToUpdate,
      this.prismaService.cartItemOption.createMany({
        data: optionsToCreate,
      }),
    ]);
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
      where: {
        id: cartItem.id,
      },
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

  private async updateCartItemOptions(
    cartItemId: number,
    options: { priceType: string; quantity: number }[],
    incrementExisting = false,
  ): Promise<void> {
    const existingOptions = await this.prismaService.cartItemOption.findMany({
      where: { cart_item_id: cartItemId },
    });

    const updates = [];
    const creates = [];

    for (const option of options) {
      const existingOption = existingOptions.find(
        (eo) => eo.price_type === option.priceType,
      );

      if (existingOption) {
        updates.push(
          this.prismaService.cartItemOption.update({
            where: { id: existingOption.id },
            data: {
              quantity: incrementExisting
                ? existingOption.quantity + option.quantity
                : option.quantity,
            },
          }),
        );
      } else {
        creates.push({
          cart_item_id: cartItemId,
          price_type: option.priceType,
          quantity: option.quantity,
        });
      }
    }

    await this.prismaService.$transaction([
      ...updates,
      this.prismaService.cartItemOption.createMany({ data: creates }),
    ]);
  }

  async mergeCarts(userId: number, sessionId: string): Promise<void> {
    const guestCart = await this.prismaService.cart.findFirst({
      where: {
        guest_session_id: sessionId,
        status: CartStatus.ACTIVE,
      },
      include: {
        cart_items: {
          include: {
            cart_item_options: true,
          },
        },
      },
    });

    if (!guestCart) {
      return;
    }

    let userCart = await this.prismaService.cart.findFirst({
      where: {
        user_id: userId,
        status: CartStatus.ACTIVE,
      },
      include: {
        cart_items: {
          include: {
            cart_item_options: true,
          },
        },
      },
    });

    if (!userCart) {
      userCart = await this.prismaService.cart.update({
        where: { id: guestCart.id },
        data: {
          user_id: userId,
          guest_session_id: null,
        },
        include: {
          cart_items: {
            include: {
              cart_item_options: true,
            },
          },
        },
      });
    } else {
      await this.prismaService.$transaction(async (prisma) => {
        for (const guestItem of guestCart.cart_items) {
          const existingItem = userCart.cart_items.find(
            (item) =>
              item.service_id === guestItem.service_id &&
              item.service_type === guestItem.service_type &&
              item.date.getTime() === guestItem.date.getTime() &&
              item.time === guestItem.time,
          );

          if (existingItem) {
            await this.updateCartItemOptions(
              existingItem.id,
              guestItem.cart_item_options.map((option) => ({
                priceType: option.price_type,
                quantity: option.quantity,
              })),
              true,
            );
          } else {
            await prisma.cartItem.create({
              data: {
                cart_id: userCart.id,
                service_id: guestItem.service_id,
                service_type: guestItem.service_type,
                date: guestItem.date,
                time: guestItem.time,
                cart_item_options: {
                  create: guestItem.cart_item_options.map((option) => ({
                    price_type: option.price_type,
                    quantity: option.quantity,
                  })),
                },
              },
            });
          }
        }

        await prisma.cart.delete({ where: { id: guestCart.id } });
      });
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
