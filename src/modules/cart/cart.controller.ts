import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Req,
} from '@nestjs/common';
import { response } from 'express';

import { CartService } from './cart.service';
import { AddItemDto } from './dto/add-item.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@Req() req) {
    const userId = req.user?.id;
    const sessionId = req.cookies['get_session_id'];

    try {
      return await this.cartService.getActiveCart(userId, sessionId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return {
          cart_items: [],
        };
      } else {
        throw error;
      }
    }
  }

  @Post()
  async addItem(@Body() addItemDto: AddItemDto, @Req() req) {
    const userId = req.user?.id;
    const sessionId = req.cookies['get_session_id'];

    await this.cartService.addItem(addItemDto, userId, sessionId);
    return response.status(200).json({ message: 'Товар добавлен в корзину' });
  }
}
