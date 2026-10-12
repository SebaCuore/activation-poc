import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

// Canal en tiempo real con la UI: cada cambio de una activación se empuja al navegador
@WebSocketGateway({ cors: { origin: '*' } })
export class ActivationsGateway {
  @WebSocketServer()
  server!: Server;

  emitUpdate(activation: unknown) {
    this.server.emit('activation.updated', activation);
  }
}