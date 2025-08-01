'use client'

import { useEffect } from 'react';
import { mockMode } from '~/lib/utils';

export function MSWProvider() {
  useEffect(() => {
    // Only run MSW in browser and when no real API URL is set
    if (typeof window === 'undefined') return;

    if (mockMode) {
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
