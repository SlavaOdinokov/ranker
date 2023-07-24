import { IsString, Length } from 'class-validator';

export class JoinPollDto {
  @IsString()
  @Length(6, 6)
  pollId: string;

  @IsString()
  @Length(1, 18)
  name: string;
}
