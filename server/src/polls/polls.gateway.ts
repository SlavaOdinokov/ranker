import {
  Logger,
  UsePipes,
  ValidationPipe,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  OnGatewayInit,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Namespace } from 'socket.io';

import { PollsService } from './polls.service';
import { SocketRequest } from './types';
import { WsCatchAllFilter } from 'src/exceptions/ws.filter';
import { AdminGuard } from 'src/guards/admin.guard';
import { NominationDto } from './dto/nomination.dto';

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

  @UseGuards(AdminGuard)
  @SubscribeMessage('remove_participant')
  async removeParticipant(
    @MessageBody('id') id: string,
    @ConnectedSocket() client: SocketRequest,
  ) {
    this.logger.debug(
      `Attempting to remove participant ${id} from poll ${client.pollId}`,
    );

    const updatedPoll = await this.pollsService.removeParticipant({
      pollId: client.pollId,
      userId: id,
    });

    if (updatedPoll) {
      this.io.to(client.pollId).emit('poll_updated', updatedPoll);
    }
  }

  @SubscribeMessage('nominate')
  async nominate(
    @MessageBody() nomination: NominationDto,
    @ConnectedSocket() client: SocketRequest,
  ): Promise<void> {
    this.logger.debug(
      `Attempting to add nomination for user ${client.userId} to poll ${client.pollId}\n${nomination.text}`,
    );

    const updatedPoll = await this.pollsService.addNomination({
      pollId: client.pollId,
      userId: client.userId,
      text: nomination.text,
    });

    this.io.to(client.pollId).emit('poll_updated', updatedPoll);
  }

  @UseGuards(AdminGuard)
  @SubscribeMessage('remove_nomination')
  async removeNomination(
    @MessageBody('id') nominationId: string,
    @ConnectedSocket() client: SocketRequest,
  ): Promise<void> {
    this.logger.debug(
      `Attempting to remove nomination ${nominationId} from poll ${client.pollId}`,
    );

    const updatedPoll = await this.pollsService.removeNomination({
      pollId: client.pollId,
      nominationId,
    });

    this.io.to(client.pollId).emit('poll_updated', updatedPoll);
  }

  @UseGuards(AdminGuard)
  @SubscribeMessage('start_vote')
  async startVote(@ConnectedSocket() client: SocketRequest): Promise<void> {
    this.logger.debug(`Attempting to start voting for poll: ${client.pollId}`);
    const updatedPoll = await this.pollsService.startPoll(client.pollId);
    this.io.to(client.pollId).emit('poll_updated', updatedPoll);
  }

  @SubscribeMessage('submit_rankings')
  async submitRankings(
    @ConnectedSocket() client: SocketRequest,
    @MessageBody('rankings') rankings: string[],
  ): Promise<void> {
    this.logger.debug(
      `Submitting votes for user: ${client.userId} belonging to pollID: "${client.pollId}"`,
    );

    const updatedPoll = await this.pollsService.submitRankings({
      pollId: client.pollId,
      userId: client.userId,
      rankings,
    });

    // an enhancement might be to not send ranking data to clients,
    // but merely a list of the participants who have voted since another
    // participant getting this data could lead to cheating
    // we may add this while working on the client
    this.io.to(client.pollId).emit('poll_updated', updatedPoll);
  }
}
