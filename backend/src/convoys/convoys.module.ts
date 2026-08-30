import { Module } from '@nestjs/common';
import { ConvoysService } from './convoys.service';
import { ConvoysController } from './convoys.controller';
import { ConvoyRiskIndexService } from './risk-index.service';

@Module({
  controllers: [ConvoysController],
  providers: [ConvoysService, ConvoyRiskIndexService],
  exports: [ConvoysService, ConvoyRiskIndexService],
})
export class ConvoysModule {}
