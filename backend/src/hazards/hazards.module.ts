import { Module } from '@nestjs/common';
import { HazardsService } from './hazards.service';
import { HazardsController } from './hazards.controller';
import { HazardFusionService } from './hazard-fusion.service';

@Module({
  controllers: [HazardsController],
  providers: [HazardsService, HazardFusionService],
  exports: [HazardsService, HazardFusionService],
})
export class HazardsModule {}
