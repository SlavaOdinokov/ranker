import { Logger, UsePipes, ValidationPipe, UseFilters } from '@nestjs/common';
import {
  OnGatewayInit,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Namespace } from 'socket.io';

import { PollsService } from './polls.service';
import { SocketRequest } from './types';
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

  async handleConnection(client: SocketRequest) {
    const sockets = this.io.sockets;

    this.logger.log(`WS Client with id: ${client.id} connected!`);
    this.logger.debug(`Number of connected sockets: ${sockets.size}`);

    const roomName = client.pollId;
    await client.join(roomName);

    const connectedClients = this.io.adapter.rooms?.get(roomName)?.size ?? 0;

    this.logger.debug(
      `userId: ${client.userId} joined room with name: ${roomName}`,
    );
    this.logger.debug(
      `Total clients connected to room '${roomName}': ${connectedClients}`,
    );

    const updatedPoll = await this.pollsService.addParticipant({
      pollId: client.pollId,
      userId: client.userId,
      name: client.name,
    });

    this.io.to(roomName).emit('poll_updated', updatedPoll);
  }

  async handleDisconnect(client: SocketRequest) {
    const sockets = this.io.sockets;

    const { pollId, userId } = client;
    const updatedPoll = await this.pollsService.removeParticipant({
      pollId,
      userId,
    });

    const roomName = client.pollId;
    const clientCount = this.io.adapter.rooms?.get(roomName)?.size ?? 0;

    this.logger.log(`Disconnected socket id: ${client.id}`);
    this.logger.debug(`Number of connected sockets: ${sockets.size}`);
    this.logger.debug(
      `Total clients connected to room '${roomName}': ${clientCount}`,
    );

    // updatedPoll could be undefined if the the poll already started
    // in this case, the socket is disconnect, but no the poll state
    if (updatedPoll) {
      this.io.to(pollId).emit('poll_updated', updatedPoll);
    }
  }
}
