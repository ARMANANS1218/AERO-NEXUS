import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
import TicketListView from './TicketListView';

export default function TeamInboxView() {
  const { teamId } = useParams();
  return (
    <div className="flex flex-1 h-full overflow-hidden min-w-0">
      <TicketListView view="team" teamInbox={teamId} />
      <div className="flex-1 min-w-0 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
