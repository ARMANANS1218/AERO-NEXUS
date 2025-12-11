import React from 'react';
import { Outlet } from 'react-router-dom';
import EmailTicketListView from './EmailTicketListView';

export default function UnassignedEmailView() {
  return (
    <>
      <EmailTicketListView view="unassigned" />
      <Outlet />
    </>
  );
}
