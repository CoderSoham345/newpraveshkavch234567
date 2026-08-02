/**
 * useRealtimeListener Hook for PraveshKavach™
 * Subscribes to real-time Firebase updates for visitor and approval status
 */

import { useEffect, useState } from 'react';
import { firebaseService } from '../services/firebaseService';

/**
 * Listen to visitor status changes in real-time
 * Returns status and loading state
 */
export function useVisitorStatusListener(visitorId: string | null) {
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | 'checked_in' | 'checked_out' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visitorId) {
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = firebaseService.onVisitorStatusChange(visitorId, (visitor) => {
        if (visitor) {
          setStatus(visitor.status as any);
        }
        setLoading(false);
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    } catch (err) {
      setError(`${err}`);
      setLoading(false);
    }
  }, [visitorId]);

  return { status, loading, error };
}

/**
 * Listen to approval requests for a resident in real-time
 * Returns array of pending approvals
 */
export function useApprovalRequestsListener(residentId: string | null) {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!residentId) {
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = firebaseService.onApprovalRequests(residentId, (appls) => {
        setApprovals(appls);
        setLoading(false);
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    } catch (err) {
      setError(`${err}`);
      setLoading(false);
    }
  }, [residentId]);

  return { approvals, loading, error };
}

/**
 * Debounced listener for frequent updates
 * Useful for OCR processing feedback
 */
export function useDebouncedListener<T>(
  subscribe: (callback: (data: T) => void) => (() => void) | null,
  delay: number = 500
): T | null {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const unsubscribe = subscribe((newData: T) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setData(newData);
      }, delay);
    });

    return () => {
      clearTimeout(timeoutId);
      if (unsubscribe) unsubscribe();
    };
  }, [subscribe, delay]);

  return data;
}
