import { Injectable } from '@nestjs/common';

import { TelegramService } from '../external/telegram/telegram.service';

@Injectable()
export class NotificationService {
  constructor(private readonly telegramService: TelegramService) {}

  async sendTelegramMessage(chatId: string, message: string): Promise<void> {
    await this.telegramService.sendMessage(chatId, message);
  }

  async sendOrderNotification(chatId: string, orderDTO: any): Promise<void> {
    let orderMessage = `*Создан новый заказ*\n`;
    orderMessage += `${new Date().toLocaleString()}\n\n`;
    orderMessage += `*Имя:* ${orderDTO.user.name}\n`;
    orderMessage += `*Телефон:* ${orderDTO.user.telephone}\n`;
    orderMessage += `*Почта:* ${orderDTO.user.email}\n\n`;
    orderMessage += `*Услуги в заказе:*\n`;
    orderDTO.orderItems.forEach((reservation: any) => {
      orderMessage += `\n*Название:* ${reservation.title}\n`;
      orderMessage += `*Дата:* ${new Date(reservation.date).toLocaleDateString()}\n`;
      orderMessage += `*Время:* ${reservation.time}\n`;
      reservation.participants.forEach((participant: any) => {
        orderMessage += `*${participant.title}:* ${participant.count} чел.\n`;
      });
    });

    orderMessage += `\n*Promo Code:* ${orderDTO.promoCode || 'N/A'}\n`;
    orderMessage += `*Payment Method:* ${orderDTO.paymentMethod.replace(/[_*[\]()~`>#+-=|{}.!]/g, '\\$&')}\n`;
    await this.telegramService.sendMessage(chatId, orderMessage, {
      parse_mode: 'Markdown',
    });
  }
}
