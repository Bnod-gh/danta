import { Module } from '@nestjs/common';
import { ImagingTwainController } from './imaging-twain.controller';

@Module({
  controllers: [ImagingTwainController],
})
export class ImagingTwainModule {}
