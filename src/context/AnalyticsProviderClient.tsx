
'use client';

import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AnalyticsContext } from './AnalyticsContext';

const sendData = (url: string, data: any) => {
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    navigator.sendBeacon(url, blob);
  } else {
    fetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(error => {
        console.error('Fetch fallback for analytics failed:', error);
    });
  }
};

function getDeviceInfo(userAgent: string | null) {
    if (!userAgent) return 'Unknown';
    if (/mobile/i.test(userAgent)) return 'Mobile';
    return 'Desktop';
}

export default function AnalyticsProviderClient({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      return;
    }
    const session = uuidv4();
    setSessionId(session);

    async function trackVisitor() {
        try {
            const response = await fetch(`https://ipapi.co/json/`);
            if (!response.ok) {
              throw new Error(`ipapi.co failed with status: ${response.status}`);
            }
            const geoData = await response.json();
            const deviceInfo = getDeviceInfo(navigator.userAgent);

            sendData('/api/track', {
                sessionId: session,
                geoData,
                deviceInfo
            });
        } catch (error) {
            console.error('Visitor tracking error:', error);
        }
    }

    trackVisitor();
  }, []);

  const trackEvent = useCallback((eventName: string, data: any) => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) return;
    
    sendData('/api/track/event', {
        collectionName: eventName,
        data: {
            ...data,
            sessionId,
            timestamp: new Date().toISOString()
        }
    });
  }, [sessionId]);

  const pageview = useCallback((url: string) => {
    trackEvent('page_visit', { pageUrl: url });
  }, [trackEvent]);
  
  const value = {
      trackEvent,
      pageview,
      sessionId,
      userId: null, // Custom Auth handles this differently now
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}
