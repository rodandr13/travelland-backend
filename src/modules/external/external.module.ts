import { Module } from '@nestjs/common';

import { SanityService } from './sanity/sanity.service';
import { TelegramService } from './telegram/telegram.service';

@Module({
  providers: [SanityService, TelegramService],
  exports: [SanityService, TelegramService],
})
export class ExternalModule {}
