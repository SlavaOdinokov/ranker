import { Body, Controller, Post } from '@nestjs/common';

import { CreatePollDto } from './dto/create.dto';
import { JoinPollDto } from './dto/join.dto';
import { PollsService } from './polls.service';
import {
  CreatePollResponse,
  JoinPollResponse,
  RejoinPollResponse,
} from './types';
import { RejoinPollDto } from './dto/rejoin.dto';

@Controller('polls')
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  @Post('/')
  async create(@Body() dto: CreatePollDto): Promise<CreatePollResponse> {
    return this.pollsService.create(dto);
  }

  @Post('/join')
  async join(@Body() dto: JoinPollDto): Promise<JoinPollResponse> {
    return this.pollsService.join(dto);
  }

  @Post('/rejoin')
  async rejoin(@Body() dto: RejoinPollDto): Promise<RejoinPollResponse> {
    return this.pollsService.rejoin(dto);
  }
}
