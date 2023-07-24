import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PollsController } from './polls.controller';
import { PollsService } from './polls.service';
import { RedisModule } from 'src/redis/redis.module';
import { getRedisConfig } from 'src/configs/redis.config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    RedisModule.registerAsync(getRedisConfig()),
  ],
  controllers: [PollsController],
  providers: [PollsService],
})
export class PollsModule {}
