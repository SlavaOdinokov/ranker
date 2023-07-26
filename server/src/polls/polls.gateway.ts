import {
  Logger,
  UsePipes,
  ValidationPipe,
  UseFilters,
  BadRequestException,
} from '@nestjs/common';
import {
  OnGatewayInit,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  WsException,
} from '@nestjs/websockets';
import { Namespace } from 'socket.io';

import { PollsService } from './polls.service';
import { SocketRequest } from './types';
import { WsBadRequestException } from 'src/exceptions/wx.exceptions';
import { WsCatchAllFilter } from 'src/exceptions/ws.filter';

@UsePipes(new ValidationPipe())
@UseFilters(new WsCatchAllFilter())
@WebSocketGateway({
  namespace: 'polls',
})
export class PollsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(PollsGateway.name);
  constructor(private readonly pollsService: PollsService) {}

  @WebSocketServer() io: Namespace;

  // Gateway initialized (provided in module and instantiated)
  afterInit(): void {
    this.logger.log(`Websocket Gateway initialized`);
  }

  handleConnection(client: SocketRequest) {
    const sockets = this.io.sockets;

    this.logger.debug(
      `Socket connected with userId: ${client.userId}, pollId: ${client.pollId}, and name: "${client.name}"`,
    );

    this.logger.log(`WS Client with id: ${client.id} connected!`);
    this.logger.debug(`Number of connected sockets: ${sockets.size}`);

    this.io.emit('hello', client.id);
  }

  handleDisconnect(client: SocketRequest) {
    const sockets = this.io.sockets;

    this.logger.debug(
      `Socket disconnected with userId: ${client.userId}, pollId: ${client.pollId}, and name: "${client.name}"`,
    );

    this.logger.log(`Disconnected socket id: ${client.id}`);
    this.logger.debug(`Number of connected sockets: ${sockets.size}`);
  }
}
