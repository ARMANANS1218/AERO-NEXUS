import React from 'react';
import { Outlet } from 'react-router-dom';
import EmailTicketListView from './EmailTicketListView';

export default function AllEmailView() {
  return (
    <>
      <EmailTicketListView view="all" />
      <Outlet />
    </>
  );
}
