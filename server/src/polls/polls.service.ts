import { Injectable } from '@nestjs/common';

import { CreatePollPayload, JoinPollPayload, RejoinPollPayload } from './types';
import { createPollId, createUserId } from 'src/utils';

@Injectable()
export class PollsService {
  async create(dto: CreatePollPayload) {
    const pollId = createPollId();
    const userId = createUserId();

    return {
      ...dto,
      pollId,
      userId,
    };
  }

  async join(dto: JoinPollPayload) {
    const userId = createUserId();

    return {
      ...dto,
      userId,
    };
  }

  async rejoin(dto: RejoinPollPayload) {
    return dto;
  }
}
