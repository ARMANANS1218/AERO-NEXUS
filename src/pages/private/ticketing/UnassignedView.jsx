import React from 'react';
import { Outlet } from 'react-router-dom';
import TicketListView from './TicketListView';

export default function UnassignedView() {
  return (
    <div className="flex flex-1 h-full overflow-hidden min-w-0">
      <TicketListView view="unassigned" />
      <div className="flex-1 min-w-0 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
