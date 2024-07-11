import { Module } from '@nestjs/common';

import { SanityService } from './sanity/sanity.service';

@Module({
  providers: [SanityService],
  exports: [SanityService],
})
export class ExternalModule {}
