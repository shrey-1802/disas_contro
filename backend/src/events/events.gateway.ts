import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`⚡ WebSocket client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`🔌 WebSocket client disconnected: ${client.id}`);
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket) {
    return { event: 'pong', data: { timestamp: new Date().toISOString() } };
  }

  /**
   * Broadcast helpers for disaster events
   */
  broadcastConvoyLocation(convoyId: string, location: any) {
    if (this.server) {
      this.server.emit('convoy.location.updated', { convoyId, location });
    }
  }

  broadcastHazardCreated(hazard: any) {
    if (this.server) {
      this.server.emit('hazard.created', hazard);
      this.server.emit('hazard:new', hazard);
    }
  }

  broadcastHazardUpdated(hazard: any) {
    if (this.server) {
      this.server.emit('hazard.updated', hazard);
    }
  }

  broadcastRouteRecalculated(routeInfo: any) {
    if (this.server) {
      this.server.emit('route:recalculated', routeInfo);
      this.server.emit('route.status.changed', routeInfo);
    }
  }

  broadcastAlertCreated(alert: any) {
    if (this.server) {
      this.server.emit('alert.created', alert);
      this.server.emit('alert:new', alert);
    }
  }

  broadcastInventoryChanged(payload: any) {
    if (this.server) {
      this.server.emit('inventory.changed', payload);
    }
  }

  broadcastSupplySwapUpdated(payload: any) {
    if (this.server) {
      this.server.emit('supply_swap.updated', payload);
      this.server.emit('transfer:status_update', payload);
    }
  }
}
