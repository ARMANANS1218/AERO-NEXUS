import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
import EmailTicketListView from './EmailTicketListView';

export default function ViewEmailView() {
  const { viewName } = useParams();
  
  // Map view name to priority
  const priorityMap = {
    'high-priority': 'high',
    'medium-priority': 'medium',
    'low-priority': 'low'
  };
  
  const priority = priorityMap[viewName] || null;
  
  return (
    <>
      <EmailTicketListView view="priority" priority={priority} />
      <Outlet />
    </>
  );
}
