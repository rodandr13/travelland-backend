import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { Cart } from '@prisma/client';
import { Request } from 'express';

import { CartService } from './cart.service';
import { GuestSession } from './decorators/guest-session.decorator';
import { AddItemDto } from './dto/add-item.dto';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { UserResponse } from '../auth/response/auth.response';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getCart(
    @CurrentUser() user: UserResponse | undefined,
    @GuestSession() sessionId: string | undefined,
  ): Promise<Cart> {
    try {
      return await this.cartService.getOrCreateActiveCart(user?.id, sessionId);
    } catch (error) {
      throw error;
    }
  }

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  async addItem(
    @Body() addItemDto: AddItemDto,
    @CurrentUser() user: UserResponse | undefined,
    @GuestSession() sessionId: string | undefined,
  ): Promise<void> {
    await this.cartService.addItem(addItemDto, user?.id, sessionId);
  }

  @Put('items/:itemId')
  @HttpCode(HttpStatus.OK)
  async updateItem(
    @Param('itemId') itemId: number,
    @Body() updateItemDto: AddItemDto,
    @CurrentUser() user: UserResponse | undefined,
    @GuestSession() sessionId: string | undefined,
  ): Promise<void> {
    await this.cartService.updateItem(
      itemId,
      updateItemDto,
      user?.id,
      sessionId,
    );
  }

  @Delete('items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeItem(
    @Param('itemId') itemId: number,
    @Req() req: Request,
    @CurrentUser() user: UserResponse | undefined,
    @GuestSession() sessionId: string | undefined,
  ): Promise<void> {
    await this.cartService.removeItem(itemId, user?.id, sessionId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearCart(
    @Req() req: Request,
    @CurrentUser() user: UserResponse | undefined,
    @GuestSession() sessionId: string | undefined,
  ): Promise<void> {
    await this.cartService.clearCart(user?.id, sessionId);
  }
}
