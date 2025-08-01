'use client'

import { useEffect } from 'react';

export function MSWProvider() {
  useEffect(() => {
    // Only run MSW in browser and when no real API URL is set
    if (typeof window === 'undefined') return;

    if (!process.env.NEXT_PUBLIC_API_URL) {
      import('~/mocks/browser')
        .then(({ worker }) => worker.start({ onUnhandledRequest: 'bypass' }))
        .then(() => {
          console.log('[MSW] Mock Service Worker started.');
        })
        .catch((err) => {
          console.error('[MSW] Failed to start worker:', err);
        });
    }
  }, []);

  return null;
}
