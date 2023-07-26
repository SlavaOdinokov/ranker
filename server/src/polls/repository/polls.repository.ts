import { Inject, InternalServerErrorException } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Poll } from 'shared';

import { Redis } from 'ioredis';
import { IORedisKey } from 'src/redis/redis.module';
import {
  AddNominationData,
  AddParticipantPayload,
  CreatePollData,
  RemoveNominationData,
  RemoveParticipantPayload,
} from '../types';

@Injectable()
export class PollsRepository {
  // to use time-to-live from configuration
  private readonly ttl: string;
  private readonly logger = new Logger(PollsRepository.name);

  constructor(
    configService: ConfigService,
    @Inject(IORedisKey) private readonly redisClient: Redis,
  ) {
    this.ttl = configService.get('POLL_DURATION'); // 2h
  }

  async createPoll({
    votesPerVoter,
    topic,
    pollId,
    userId,
  }: CreatePollData): Promise<Poll> {
    const initialPoll: Poll = {
      id: pollId,
      topic,
      votesPerVoter,
      participants: {},
      nominations: {},
      adminId: userId,
      hasStarted: false,
    };

    this.logger.log(
      `Creating new poll: ${JSON.stringify(initialPoll, null, 2)} with TTL ${
        this.ttl
      }`,
    );

    const key = `polls:${pollId}`;

    try {
      await this.redisClient.setex(key, +this.ttl, JSON.stringify(initialPoll));
      return initialPoll;
    } catch (e) {
      this.logger.error(
        `Failed to add poll ${JSON.stringify(initialPoll)}\n${e}`,
      );
      throw new InternalServerErrorException();
    }
  }

  async getPoll(pollId: string): Promise<Poll> {
    this.logger.log(`Attempting to get poll with: ${pollId}`);

    const key = `polls:${pollId}`;

    try {
      const currentPoll = await this.redisClient.get(key);
      this.logger.verbose(currentPoll);

      // if (currentPoll?.hasStarted) {
      //   throw new BadRequestException('The poll has already started');
      // }

      return JSON.parse(currentPoll) as Poll;
    } catch (e) {
      this.logger.error(`Failed to get pollId ${pollId}`);
      throw new InternalServerErrorException(`Failed to get pollId ${pollId}`);
    }
  }

  async addParticipant({
    pollId,
    userId,
    name,
  }: AddParticipantPayload): Promise<Poll> {
    this.logger.log(
      `Attempting to add a participant with userId/name: ${userId}/${name} to pollId: ${pollId}`,
    );

    const key = `polls:${pollId}`;

    try {
      const currentPoll = await this.redisClient.get(key);
      const updatedPoll = JSON.parse(currentPoll) as Poll;
      updatedPoll.participants[userId] = name;
      await this.redisClient.setex(key, +this.ttl, JSON.stringify(updatedPoll));

      return this.getPoll(pollId);
    } catch (e) {
      this.logger.error(
        `Failed to add a participant with userId/name: ${userId}/${name} to pollId: ${pollId}`,
      );
      throw new InternalServerErrorException(
        `Failed to add a participant with userId/name: ${userId}/${name} to pollId: ${pollId}`,
      );
    }
  }

  async removeParticipant({
    pollId,
    userId,
  }: RemoveParticipantPayload): Promise<Poll> {
    this.logger.log(`removing userId: ${userId} from poll: ${pollId}`);

    const key = `polls:${pollId}`;

    try {
      const currentPoll = await this.redisClient.get(key);
      const updatedPoll = JSON.parse(currentPoll) as Poll;
      Object.keys(updatedPoll.participants).forEach((id) => {
        if (id === userId) delete updatedPoll.participants[id];
      });
      await this.redisClient.setex(key, +this.ttl, JSON.stringify(updatedPoll));

      return this.getPoll(pollId);
    } catch (e) {
      this.logger.error(
        `Failed to remove userId: ${userId} from poll: ${pollId}`,
        e,
      );
      throw new InternalServerErrorException('Failed to remove participant');
    }
  }

  async addNomination({
    pollId,
    nominationId,
    nomination,
  }: AddNominationData): Promise<Poll> {
    this.logger.log(
      `Attempting to add a nomination with nominationID/nomination: ${nominationId}/${nomination.text} to pollId: ${pollId}`,
    );

    const key = `polls:${pollId}`;

    try {
      const currentPoll = await this.redisClient.get(key);
      const updatedPoll = JSON.parse(currentPoll) as Poll;
      updatedPoll.nominations[nominationId] = nomination;
      await this.redisClient.setex(key, +this.ttl, JSON.stringify(updatedPoll));

      return this.getPoll(pollId);
    } catch (e) {
      this.logger.error(
        `Failed to add a nomination with nominationID/text: ${nominationId}/${nomination.text} to pollId: ${pollId}`,
        e,
      );
      throw new InternalServerErrorException(
        `Failed to add a nomination with nominationID/text: ${nominationId}/${nomination.text} to pollId: ${pollId}`,
      );
    }
  }

  async removeNomination({
    pollId,
    nominationId,
  }: RemoveNominationData): Promise<Poll> {
    this.logger.log(
      `removing nominationID: ${nominationId} from poll: ${pollId}`,
    );

    const key = `polls:${pollId}`;

    try {
      const currentPoll = await this.redisClient.get(key);
      const updatedPoll = JSON.parse(currentPoll) as Poll;
      Object.keys(updatedPoll.nominations).forEach((id) => {
        if (id === nominationId) delete updatedPoll.nominations[id];
      });
      await this.redisClient.setex(key, +this.ttl, JSON.stringify(updatedPoll));

      return this.getPoll(pollId);
    } catch (e) {
      this.logger.error(
        `Failed to remove nominationId: ${nominationId} from poll: ${pollId}`,
        e,
      );
      throw new InternalServerErrorException(
        `Failed to remove nominationId: ${nominationId} from poll: ${pollId}`,
      );
    }
  }
}
