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

export interface CreatePollResponse extends CreatePollPayload {
  pollId: string;
  userId: string;
}

export interface JoinPollResponse extends JoinPollPayload {
  userId: string;
}

export type RejoinPollResponse = RejoinPollPayload;
