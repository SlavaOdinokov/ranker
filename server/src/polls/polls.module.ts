import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { PollsController } from './polls.controller';
import { PollsService } from './polls.service';
import { PollsRepository } from './repository/polls.repository';
import { RedisModule } from 'src/redis/redis.module';
import { getRedisConfig } from 'src/configs/redis.config';
import { getJwtConfig } from 'src/configs/jwt.config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    RedisModule.registerAsync(getRedisConfig()),
    JwtModule.registerAsync(getJwtConfig()),
  ],
  controllers: [PollsController],
  providers: [PollsService, PollsRepository],
})
export class PollsModule {}
