import React, { Suspense } from 'react';
import EmailComponent from '../../../components/Email/EmailComponent';
import Loading from '../../../components/common/Loading';

export default function EmailPage() {
  return (
    <Suspense fallback={<Loading fullScreen size="lg" />}>
      <EmailComponent />
    </Suspense>
  );
}
