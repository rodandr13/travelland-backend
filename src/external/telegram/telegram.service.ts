import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';

@Injectable()
export class TelegramService {
  private bot: Telegraf;

  constructor(private readonly configService: ConfigService) {
    const telegramToken = this.configService.get<string>('TELEGRAM_TOKEN');
    this.bot = new Telegraf(telegramToken);
  }

  async sendMessage(chatId: string, message: string): Promise<void> {
    await this.bot.telegram.sendMessage(chatId, message);
  }
}
