import { IsString, Length } from 'class-validator';

export class RejoinPollDto {
  @IsString()
  @Length(6, 6)
  pollId: string;

  @IsString()
  userId: string;

  @IsString()
  @Length(1, 18)
  name: string;
}
