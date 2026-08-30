import { Module } from '@nestjs/common';
import { RoutesService } from './routes.service';
import { RoutesController } from './routes.controller';
import { RouteGraphService } from './route-graph.service';

@Module({
  controllers: [RoutesController],
  providers: [RoutesService, RouteGraphService],
  exports: [RoutesService, RouteGraphService],
})
export class RoutesModule {}
