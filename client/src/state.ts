import { proxy } from 'valtio';
import { subscribeKey } from 'valtio/utils';

import { Poll } from 'shared';
import { getTokenPayload } from './util';

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

export interface AppState {
  isLoading: boolean;
  currentPage: AppPage;
  poll?: Poll;
  accessToken?: string;
  me?: Me;
  isAdmin: boolean;
}

const state: AppState = proxy<AppState>({
  isLoading: false,
  currentPage: AppPage.Welcome,

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
};

subscribeKey(state, 'accessToken', () => {
  if (state.accessToken) {
    localStorage.setItem('accessToken', state.accessToken);
  }
});

export { state, actions };
