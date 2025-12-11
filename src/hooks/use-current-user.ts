'use client';

import { useState, useEffect } from 'react';
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
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(false);

  useEffect(() => {
    // If no session or still loading session, reset user
    if (sessionLoading) return;

    if (!session?.user?.id) {
      setUser(null);
      return;
    }

    // Fetch user role from API
    setIsLoadingRole(true);
    fetch('/api/user/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        } else {
          setUser({ id: session.user.id, role: null });
        }
      })
      .catch((err) => {
        console.error('Error fetching user role:', err);
        setUser({ id: session.user.id, role: null });
      })
      .finally(() => {
        setIsLoadingRole(false);
      });
  }, [session?.user?.id, sessionLoading]);

  return {
    user,
    isLoading: sessionLoading || isLoadingRole,
  };
}
