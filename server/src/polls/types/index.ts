import { Poll } from 'shared';

export interface CreatePollPayload {
  topic: string;
  votesPerVoter: number;
  name: string;
}

export interface JoinPollPayload {
  pollId: string;
  name: string;
}

export interface RejoinPollPayload {
  pollId: string;
  userId: string;
  name: string;
}

export interface CreatePollResponse {
  poll: Poll;
  accessToken: string;
}

export type JoinPollResponse = CreatePollResponse;

export interface RejoinPollResponse {
  poll: Poll;
}

export interface CreatePollData {
  pollId: string;
  topic: string;
  votesPerVoter: number;
  userId: string;
}

export interface AddParticipantData {
  pollId: string;
  userId: string;
  name: string;
}
