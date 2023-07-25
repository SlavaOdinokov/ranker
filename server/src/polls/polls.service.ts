import { Injectable, Logger } from '@nestjs/common';

import { CreatePollPayload, JoinPollPayload, RejoinPollPayload } from './types';
import { createPollId, createUserId } from 'src/utils';
import { PollsRepository } from './repository/polls.repository';

@Injectable()
export class PollsService {
  private readonly logger = new Logger(PollsService.name);
  constructor(private readonly pollsRepository: PollsRepository) {}

  async create(dto: CreatePollPayload) {
    const pollId = createPollId();
    const userId = createUserId();

    const createdPoll = await this.pollsRepository.createPoll({
      ...dto,
      pollId,
      userId,
    });

    return { poll: createdPoll };
  }

  async join(dto: JoinPollPayload) {
    const userId = createUserId();

    this.logger.debug(
      `Fetching poll with id: ${dto.pollId} for user with id: ${userId}`,
    );

    const joinedPoll = await this.pollsRepository.getPoll(dto.pollId);

    return { poll: joinedPoll };
  }

  async rejoin(dto: RejoinPollPayload) {
    this.logger.debug(
      `Rejoining poll with ID: ${dto.pollId} for user with ID: ${dto.userId} with name: ${dto.name}`,
    );

    const joinedPoll = await this.pollsRepository.addParticipant(dto);
    return { poll: joinedPoll };
  }
}
