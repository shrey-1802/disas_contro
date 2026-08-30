import { Module } from '@nestjs/common';
import { SupplyRequestsService } from './supply-requests.service';
import { SupplyRequestsController } from './supply-requests.controller';

@Module({
  controllers: [SupplyRequestsController],
  providers: [SupplyRequestsService],
  exports: [SupplyRequestsService],
})
export class SupplyRequestsModule {}
