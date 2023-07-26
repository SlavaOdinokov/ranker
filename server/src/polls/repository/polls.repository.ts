import { Inject, InternalServerErrorException } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Poll } from 'shared';

import { Redis } from 'ioredis';
import { IORedisKey } from 'src/redis/redis.module';
import {
  AddNominationData,
  AddParticipantPayload,
  AddParticipantRankingsData,
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
      rankings: {},
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

    try {
      const key = `polls:${pollId}`;
      const currentPoll = await this.redisClient.get(key);
      this.logger.verbose(currentPoll);

      // if (currentPoll?.hasStarted) {
      //   throw new BadRequestException('The poll has already started');
      // }

      return JSON.parse(currentPoll) as Poll;
    } catch (err) {
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

    try {
      const field = `participants.${userId}`;
      await this.updatePoll(pollId, field, name);

      return this.getPoll(pollId);
    } catch (err) {
      this.logger.error(
        `Failed to add a participant with userId/name: ${userId}/${name} to pollId: ${pollId}`,
        err,
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

    try {
      const field = `participants`;
      await this.updatePoll(pollId, field, {}, userId);

      return this.getPoll(pollId);
    } catch (err) {
      this.logger.error(
        `Failed to remove userId: ${userId} from poll: ${pollId}`,
        err,
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

    try {
      const field = `nominations.${nominationId}`;
      await this.updatePoll(pollId, field, nomination);

      return this.getPoll(pollId);
    } catch (err) {
      this.logger.error(
        `Failed to add a nomination with nominationID/text: ${nominationId}/${nomination.text} to pollId: ${pollId}`,
        err,
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

    try {
      const field = `nominations`;
      await this.updatePoll(pollId, field, {}, nominationId);

      return this.getPoll(pollId);
    } catch (err) {
      this.logger.error(
        `Failed to remove nominationId: ${nominationId} from poll: ${pollId}`,
        err,
      );
      throw new InternalServerErrorException(
        `Failed to remove nominationId: ${nominationId} from poll: ${pollId}`,
      );
    }
  }

  async startPoll(pollId: string): Promise<Poll> {
    this.logger.log(`setting hasStarted for poll: ${pollId}`);

    try {
      const field = `hasStarted`;
      await this.updatePoll(pollId, field, true);
      return this.getPoll(pollId);
    } catch (err) {
      this.logger.error(`Failed set hasStarted for poll: ${pollId}`, err);
      throw new InternalServerErrorException(
        'The was an error starting the poll',
      );
    }
  }

  async addParticipantRankings({
    pollId,
    userId,
    rankings,
  }: AddParticipantRankingsData): Promise<Poll> {
    this.logger.log(
      `Attempting to add rankings for userId/name: ${userId} to pollId: ${pollId}`,
      rankings,
    );

    try {
      const field = `rankings.${userId}`;
      await this.updatePoll(pollId, field, rankings);
      return this.getPoll(pollId);
    } catch (e) {
      this.logger.error(
        `Failed to add a rankings for userId/name: ${userId}/ to pollId: ${pollId}`,
        rankings,
      );
      throw new InternalServerErrorException(
        'There was an error starting the poll',
      );
    }
  }

  private async updatePoll(
    pollId: string,
    field: string,
    value: any,
    removeId?: string,
  ) {
    const key = `polls:${pollId}`;
    const currentPoll = await this.redisClient.get(key);
    const ttl = await this.redisClient.ttl(key);
    const updatedPoll = JSON.parse(currentPoll) as Poll;
    const keysArr = field.split('.');

    if (removeId) {
      Object.keys(updatedPoll[field]).forEach((id) => {
        if (id === removeId) delete updatedPoll[field][id];
      });
    } else {
      if (keysArr.length === 2) {
        updatedPoll[keysArr[0]] = {
          ...updatedPoll[keysArr[0]],
          [keysArr[1]]: value,
        };
      } else {
        updatedPoll[field] = value;
      }
    }

    await this.redisClient.setex(key, ttl, JSON.stringify(updatedPoll));
  }
}
