import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { CreatePollDto } from './dto/create.dto';
import { JoinPollDto } from './dto/join.dto';
import { PollsService } from './polls.service';
import {
  AuthRequest,
  CreatePollResponse,
  JoinPollResponse,
  RejoinPollResponse,
} from './types';
import { AuthGuard } from 'src/guards/jwt.guard';

@UsePipes(new ValidationPipe())
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

  @UseGuards(AuthGuard)
  @Post('/rejoin')
  async rejoin(@Req() req: AuthRequest): Promise<RejoinPollResponse> {
    const { userId, pollId, name } = req;
    console.log('userId ', userId);
    console.log('pollId ', pollId);
    console.log('name ', name);
    return this.pollsService.rejoin({ userId, pollId, name });
  }
}
