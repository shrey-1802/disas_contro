import { Module } from '@nestjs/common';
import { SupplySwapsService } from './supply-swaps.service';
import { SupplySwapsController } from './supply-swaps.controller';
import { MatchingEngineService } from './matching-engine.service';

@Module({
  controllers: [SupplySwapsController],
  providers: [SupplySwapsService, MatchingEngineService],
  exports: [SupplySwapsService, MatchingEngineService],
})
export class SupplySwapsModule {}
