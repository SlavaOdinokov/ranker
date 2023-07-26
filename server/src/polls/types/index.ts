import { Request } from 'express';
import { Socket } from 'socket.io';

import { Nomination, Poll } from 'shared';

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

export interface AddParticipantPayload {
  pollId: string;
  userId: string;
  name: string;
}

export interface AddNominationPayload {
  pollId: string;
  userId: string;
  text: string;
}

export interface RemoveParticipantPayload {
  pollId: string;
  userId: string;
}

export type SubmitRankingsPayload = {
  pollId: string;
  userId: string;
  rankings: string[];
};

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

export interface AddNominationData {
  pollId: string;
  nominationId: string;
  nomination: Nomination;
}

export interface RemoveNominationData {
  pollId: string;
  nominationId: string;
}

export type AddParticipantRankingsData = {
  pollId: string;
  userId: string;
  rankings: string[];
};

export interface AuthRequestBody {
  accessToken: string;
}

export interface AuthPayload {
  pollId: string;
  userId: string;
  name: string;
}

export type AuthRequest = Request & AuthPayload;

export type SocketRequest = Socket & AuthPayload;
