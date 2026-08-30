import { Module, Global } from '@nestjs/common';
import { MapsService } from './maps.service';
import { MapsController } from './maps.controller';
import { MockMapsProvider } from './mock-maps.provider';

@Global()
@Module({
  controllers: [MapsController],
  providers: [MapsService, MockMapsProvider],
  exports: [MapsService],
})
export class MapsModule {}
