import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { SanityService } from './sanity/sanity.service';
import { TelegramService } from './telegram/telegram.service';

@Module({
  imports: [ConfigModule],
  providers: [SanityService, TelegramService],
  exports: [SanityService],
})
export class ExternalModule {}
