import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
import EmailTicketListView from './EmailTicketListView';

export default function TeamInboxEmailView() {
  const { teamName } = useParams();
  return (
    <>
      <EmailTicketListView view="team" teamInbox={teamName} />
      <Outlet />
    </>
  );
}
