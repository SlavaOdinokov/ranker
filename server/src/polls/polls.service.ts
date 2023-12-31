import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { Poll } from 'shared';

import {
  AddNominationPayload,
  AddParticipantPayload,
  CreatePollPayload,
  JoinPollPayload,
  RejoinPollPayload,
  RemoveNominationData,
  RemoveParticipantPayload,
  SubmitRankingsPayload,
} from './types';
import {
  createPollId,
  createUserId,
  createNominationId,
  getResults,
} from 'src/utils';
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

  async getPoll(pollId: string): Promise<Poll> {
    return this.pollsRepository.getPoll(pollId);
  }

  async addParticipant(dto: AddParticipantPayload): Promise<Poll> {
    return this.pollsRepository.addParticipant(dto);
  }

  async removeParticipant({
    userId,
    pollId,
  }: RemoveParticipantPayload): Promise<Poll | void> {
    const poll = await this.pollsRepository.getPoll(pollId);

    if (poll && !poll.hasStarted) {
      const updatedPoll = await this.pollsRepository.removeParticipant({
        userId,
        pollId,
      });
      return updatedPoll;
    }
  }

  async addNomination({
    pollId,
    userId,
    text,
  }: AddNominationPayload): Promise<Poll> {
    return this.pollsRepository.addNomination({
      pollId,
      nominationId: createNominationId(),
      nomination: { userId, text },
    });
  }

  async removeNomination({
    pollId,
    nominationId,
  }: RemoveNominationData): Promise<Poll> {
    return this.pollsRepository.removeNomination({ pollId, nominationId });
  }

  async startPoll(pollId: string): Promise<Poll> {
    return this.pollsRepository.startPoll(pollId);
  }

  async submitRankings(dto: SubmitRankingsPayload): Promise<Poll> {
    const hasPollStarted = this.pollsRepository.getPoll(dto.pollId);

    if (!hasPollStarted) {
      throw new BadRequestException(
        'Participants cannot rank until the poll has started.',
      );
    }

    return this.pollsRepository.addParticipantRankings(dto);
  }

  async computeResults(pollId: string): Promise<Poll> {
    const poll = await this.pollsRepository.getPoll(pollId);

    const results = getResults(
      poll.rankings,
      poll.nominations,
      poll.votesPerVoter,
    );

    return this.pollsRepository.addResults(pollId, results);
  }

  async cancelPoll(pollId: string): Promise<void> {
    await this.pollsRepository.deletePoll(pollId);
  }
}
