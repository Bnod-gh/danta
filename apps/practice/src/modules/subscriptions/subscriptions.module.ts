import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  controllers: [],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
