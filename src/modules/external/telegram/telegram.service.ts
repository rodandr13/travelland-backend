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

  async sendMessage(
    chatId: string,
    message: string,
    options = {},
  ): Promise<void> {
    await this.bot.telegram.sendMessage(chatId, message, options);
  }

  logChatId(): void {
    this.bot.on('message', (ctx) => {
      const chatId = ctx.chat.id;
      console.log('Chat ID:', chatId);
      ctx.reply(`This chat's ID: ${chatId}`);
    });
    this.bot
      .launch()
      .then(() => {
        console.log('Bot is running and ready to log chat IDs.');
      })
      .catch((err) => {
        console.error('Error launching bot:', err);
      });
  }
}