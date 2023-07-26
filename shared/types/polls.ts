export interface Participants {
  [participantId: string]: string;
}

export interface Nomination {
  userId: string;
  text: string;
}
export type NominationID = string;

export interface Nominations {
  [nominationId: NominationID]: Nomination;
}

export interface Rankings {
  [userId: string]: NominationID[];
}

export interface Poll {
  id: string;
  topic: string;
  votesPerVoter: number;
  participants: Participants;
  adminId: string;
  nominations: Nominations;
  rankings: Rankings;
  // results: Results;
  hasStarted: boolean;
}
