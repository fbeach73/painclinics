'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from '@/lib/auth-client';

interface CurrentUser {
  id: string;
  role: string | null;
}

interface UseCurrentUserResult {
  user: CurrentUser | null;
  isLoading: boolean;
}

/**
 * Hook to get the current user with their role.
 * Combines session check with role lookup from API.
 */
export function useCurrentUser(): UseCurrentUserResult {
  const { data: session, isPending: sessionLoading } = useSession();
  const [state, setState] = useState<{
    user: CurrentUser | null;
    isLoadingRole: boolean;
  }>({ user: null, isLoadingRole: false });
  const prevUserIdRef = useRef<string | undefined>(undefined);

  const fetchUserRole = useCallback(async (userId: string) => {
    try {
      const res = await fetch('/api/user/me');
      const data = await res.json();
      if (data.user) {
        return data.user as CurrentUser;
      }
      return { id: userId, role: null };
    } catch (err) {
      console.error('Error fetching user role:', err);
      return { id: userId, role: null };
    }
  }, []);

  useEffect(() => {
    // If still loading session, wait
    if (sessionLoading) return;

    const userId = session?.user?.id;

    // Skip if userId hasn't changed
    if (prevUserIdRef.current === userId) return;
    prevUserIdRef.current = userId;

    let cancelled = false;

    // No session - reset user (async to avoid sync setState in effect)
    if (!userId) {
      queueMicrotask(() => {
        if (!cancelled) setState({ user: null, isLoadingRole: false });
      });
      return () => {
        cancelled = true;
      };
    }

    // Fetch user role from API (async setState happens in promise chain)
    queueMicrotask(() => {
      if (!cancelled) setState((prev) => ({ ...prev, isLoadingRole: true }));
    });

    fetchUserRole(userId).then((user) => {
      if (!cancelled) {
        setState({ user, isLoadingRole: false });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, sessionLoading, fetchUserRole]);

  return {
    user: state.user,
    isLoading: sessionLoading || state.isLoadingRole,
  };
}
