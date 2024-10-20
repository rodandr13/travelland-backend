import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Req,
} from '@nestjs/common';

import { CartService } from './cart.service';
import { UpsertItemDto } from './dto/upsert-item.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@Req() req) {
    const userId = req.user?.id;
    const sessionId = req.cookies['guest_session_id'];
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

  @Post('items')
  async addItem(@Body() addItemDto: UpsertItemDto, @Req() req) {
    const userId = req.user?.id;
    const sessionId = req.cookies['guest_session_id'];
    await this.cartService.upsertItem(addItemDto, userId, sessionId);
    return { message: 'Товар добавлен в корзину' };
  }
}
