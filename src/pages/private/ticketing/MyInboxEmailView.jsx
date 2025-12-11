import React from 'react';
import { Outlet } from 'react-router-dom';
import EmailTicketListView from './EmailTicketListView';

export default function MyInboxView() {
  return (
    <>
      <EmailTicketListView view="my-inbox" />
      <Outlet />
    </>
  );
}
