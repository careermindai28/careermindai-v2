'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/components/providers/AuthProvider';
import { getFirebaseDb, isFirebaseReady } from '@/lib/firebaseClient';

export type PlanTier = 'FREE' | 'STARTER' | 'PRO';

export type UserPlan = {
  tier: PlanTier;
  paidUntil?: string;
  isActive: boolean;
  loading: boolean;
};

function parseTier(v: any): PlanTier {
  const s = String(v || '').toUpperCase();
  if (s === 'PRO') return 'PRO';
  if (s === 'STARTER') return 'STARTER';
  return 'FREE';
}

function isActiveUntil(paidUntil?: string) {
  if (!paidUntil) return false;
  const t = Date.parse(paidUntil);
  if (!Number.isFinite(t)) return false;
  return t > Date.now();
}

export function useUserPlan(): UserPlan {
  const { user } = useAuth();
  const [state, setState] = useState<UserPlan>({ tier: 'FREE', isActive: false, loading: true });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // Not signed in => free
      if (!user || !isFirebaseReady()) {
        if (!cancelled) setState({ tier: 'FREE', isActive: false, loading: false });
        return;
      }

      try {
        const db = getFirebaseDb();
        const snap = await getDoc(doc(db, 'users', user.uid));
        const d = snap.exists() ? (snap.data() as any) : {};
        const tier = parseTier(d?.plan);
        const paidUntil = typeof d?.paidUntil === 'string' ? d.paidUntil : undefined;
        const active = tier !== 'FREE' && isActiveUntil(paidUntil);
        if (!cancelled)
          setState({ tier: active ? tier : 'FREE', paidUntil, isActive: active, loading: false });
      } catch {
        if (!cancelled) setState({ tier: 'FREE', isActive: false, loading: false });
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return state;
}
