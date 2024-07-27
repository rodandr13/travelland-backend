import { Module } from '@nestjs/common';

import { NotificationService } from './notification.service';
import { ExternalModule } from '../external/external.module';

@Module({
  imports: [ExternalModule],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
