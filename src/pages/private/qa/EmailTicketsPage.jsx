import React, { Suspense } from 'react';
import Loading from '../../../components/common/Loading';
import EmailTickets from '../../../components/tickets/EmailTickets';

export default function QaEmailTicketsPage(){
  return (
    <Suspense fallback={<Loading fullScreen size="lg" />}> 
      <EmailTickets />
    </Suspense>
  );
}
