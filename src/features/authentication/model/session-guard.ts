'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from './auth.store';

/** Loads the stored session after mount (avoids hydration mismatches). */
export function useHydratedSession() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrated = useAuthStore((s) => s.hydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!useAuthStore.getState().hydrated) {
      hydrate();
    }
  }, [hydrate]);

  return { hydrated, isAuthenticated, user };
}

/** Redirects to /login when there is no session. */
export function useRequireSession() {
  const router = useRouter();
  const session = useHydratedSession();

  useEffect(() => {
    if (session.hydrated && !session.isAuthenticated) {
      router.replace('/login');
    }
  }, [session.hydrated, session.isAuthenticated, router]);

  return session;
}

/** Redirects to the home page when a session already exists. */
export function useRedirectIfAuthenticated(target = '/') {
  const router = useRouter();
  const session = useHydratedSession();

  useEffect(() => {
    if (session.hydrated && session.isAuthenticated) {
      router.replace(target);
    }
  }, [session.hydrated, session.isAuthenticated, router, target]);

  return session;
}
