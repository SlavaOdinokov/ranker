import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { CreatePollPayload, JoinPollPayload, RejoinPollPayload } from './types';
import { createPollId, createUserId } from 'src/utils';
import { PollsRepository } from './repository/polls.repository';

@Injectable()
export class PollsService {
  private readonly logger = new Logger(PollsService.name);
  constructor(
    private readonly pollsRepository: PollsRepository,
    private readonly jwtService: JwtService,
  ) {}

  async create(dto: CreatePollPayload) {
    const pollId = createPollId();
    const userId = createUserId();

    const createdPoll = await this.pollsRepository.createPoll({
      ...dto,
      pollId,
      userId,
    });

    this.logger.debug(
      `Creating token string for pollId: ${createdPoll.id} and userId: ${userId}`,
    );

    const signedString = this.jwtService.sign(
      {
        pollId: createdPoll.id,
        name: dto.name,
      },
      {
        subject: userId,
      },
    );

    return {
      poll: createdPoll,
      accessToken: signedString,
    };
  }

  async join(dto: JoinPollPayload) {
    const userId = createUserId();

    this.logger.debug(
      `Fetching poll with id: ${dto.pollId} for user with id: ${userId}`,
    );

    const joinedPoll = await this.pollsRepository.getPoll(dto.pollId);

    this.logger.debug(
      `Creating token string for pollId: ${joinedPoll.id} and userId: ${userId}`,
    );

    const signedString = this.jwtService.sign(
      {
        pollId: joinedPoll.id,
        name: dto.name,
      },
      {
        subject: userId,
      },
    );

    return {
      poll: joinedPoll,
      accessToken: signedString,
    };
  }

  async rejoin(dto: RejoinPollPayload) {
    this.logger.debug(
      `Rejoining poll with ID: ${dto.pollId} for user with ID: ${dto.userId} with name: ${dto.name}`,
    );

    const joinedPoll = await this.pollsRepository.addParticipant(dto);
    return { poll: joinedPoll };
  }
}
