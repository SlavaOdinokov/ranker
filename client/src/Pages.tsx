import React from 'react';
import { useSnapshot } from 'valtio';
import { CSSTransition } from 'react-transition-group'

import { AppPage, state } from './state';
import Welcome from './pages/Welcome';
import Create from './pages/Create';
import Join from './pages/Join';
import WaitingRoom from './pages/WaitingRoom';

const routeConfig = {
  [AppPage.Welcome]: Welcome,
  [AppPage.Create]: Create,
  [AppPage.Join]: Join,
  [AppPage.WaitingRoom]: WaitingRoom
};

const Pages: React.FC = () => {
  const currentState = useSnapshot(state);

  return (
    <>
      {Object.entries(routeConfig).map(([page, PageComponent]) => (
        <CSSTransition
          key={page}
          in={page === currentState.currentPage}
          timeout={300}
          classNames="page"
          unmountOnExit
        >
          <div className="page mobile-height max-w-screen-sm mx-auto py-8 px-4 overflow-y-auto">
            <PageComponent />
          </div>
        </CSSTransition>
      ))}
    </>
  );
}

export default Pages;
