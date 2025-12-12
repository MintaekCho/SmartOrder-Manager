'use client';

import { Suspense } from 'react';
import PageLoadingBar from '@/components/ui/PageLoadingBar';

export default function PageLoadingProvider() {
  return (
    <Suspense fallback={null}>
      <PageLoadingBar />
    </Suspense>
  );
}
