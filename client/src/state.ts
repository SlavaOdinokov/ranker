import { nanoid } from 'nanoid';
import { Socket } from 'socket.io-client';
import { proxy, ref } from 'valtio';
import { subscribeKey } from 'valtio/utils';

import { Poll } from 'shared';
import { getTokenPayload } from './util';
import { createSocketWithHandlers, socketIOUrl } from './socket-io';

export enum AppPage {
  Welcome = 'welcome',
  Create = 'create',
  Join = 'join',
  WaitingRoom = 'waiting-room',
}

interface Me {
  id: string;
  name: string;
}

interface WsError {
  type: string;
  message: string;
}

interface WsErrorUnique extends WsError {
  id: string;
}

export interface AppState {
  isLoading: boolean;
  currentPage: AppPage;
  wsErrors: WsErrorUnique[];
  poll?: Poll;
  accessToken?: string;
  socket?: Socket;
  me?: Me;
  isAdmin: boolean;
}

const state: AppState = proxy<AppState>({
  isLoading: false,
  currentPage: AppPage.Welcome,
  wsErrors: [],

  get me() {
    const accessToken = this.accessToken;
    if (!accessToken) return;
    const decodedToken = getTokenPayload(accessToken);
    return {
      id: decodedToken.sub,
      name: decodedToken.name,
    };
  },

  get isAdmin() {
    if (!this.me) return false;
    return this.me?.id === this.poll?.adminId;
  },
});

const actions = {
  setPage: (page: AppPage): void => {
    state.currentPage = page;
  },
  startOver: (): void => {
    actions.setPage(AppPage.Welcome);
  },
  startLoading: (): void => {
    state.isLoading = true;
  },
  stopLoading: (): void => {
    state.isLoading = false;
  },
  initializePoll: (poll?: Poll): void => {
    state.poll = poll;
  },
  setPollAccessToken: (token?: string): void => {
    state.accessToken = token;
  },
  initializeSocket: (): void => {
    if (!state.socket) {
      state.socket = ref(
        createSocketWithHandlers({
          socketIOUrl,
          state,
          actions,
        })
      );
      return;
    }
    if (!state.socket.connected) {
      state.socket.connect();
      return;
    }
    actions.stopLoading();
  },
  updatePoll: (poll: Poll): void => {
    state.poll = poll;
  },
  addWsError: (error: WsError): void => {
    state.wsErrors = [
      ...state.wsErrors,
      {
        ...error,
        id: nanoid(6),
      },
    ];
  },
  removeWsError: (id: string): void => {
    state.wsErrors = state.wsErrors.filter((error) => error.id !== id);
  },
};

subscribeKey(state, 'accessToken', () => {
  if (state.accessToken) {
    localStorage.setItem('accessToken', state.accessToken);
  }
});

export type AppActions = typeof actions;

export { state, actions };
