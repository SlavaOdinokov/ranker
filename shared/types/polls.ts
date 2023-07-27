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

export interface Result {
  nominationID: NominationID;
  nominationText: string;
  score: number;
}

export interface Poll {
  id: string;
  topic: string;
  votesPerVoter: number;
  participants: Participants;
  adminId: string;
  nominations: Nominations;
  rankings: Rankings;
  results: Result[];
  hasStarted: boolean;
}
