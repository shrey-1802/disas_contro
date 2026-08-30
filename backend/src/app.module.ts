import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

import configuration from './config/configuration';
import { PrismaModule } from './database/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { InventoryModule } from './inventory/inventory.module';
import { SheltersModule } from './shelters/shelters.module';
import { SupplyRequestsModule } from './supply-requests/supply-requests.module';
import { SupplySwapsModule } from './supply-swaps/supply-swaps.module';
import { HazardsModule } from './hazards/hazards.module';
import { RoutesModule } from './routes/routes.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { ConvoysModule } from './convoys/convoys.module';
import { EventsModule } from './events/events.module';
import { AlertsModule } from './alerts/alerts.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SettingsModule } from './settings/settings.module';
import { AuditModule } from './audit/audit.module';
import { MapsModule } from './external/maps/maps.module';

import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('throttle.ttl') || 60000,
          limit: config.get<number>('throttle.limit') || 120,
        },
      ],
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    WarehousesModule,
    InventoryModule,
    SheltersModule,
    SupplyRequestsModule,
    SupplySwapsModule,
    HazardsModule,
    RoutesModule,
    VehiclesModule,
    ConvoysModule,
    EventsModule,
    AlertsModule,
    DashboardModule,
    SettingsModule,
    AuditModule,
    MapsModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
