'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/components/providers/AuthProvider';
import { getFirebaseDb, isFirebaseReady } from '@/lib/firebaseClient';
import { isAdminEmail, normalizePlan, PlanTier } from '@/lib/entitlements';

export type { PlanTier };

type PlanState = {
  loading: boolean;
  tier: PlanTier;
  paidUntil?: number | null; // ms epoch
};

function nowMs() {
  return Date.now();
}

function parsePaidUntil(v: any): number | null {
  if (!v) return null;
  if (typeof v?.toMillis === 'function') return v.toMillis(); // Firestore Timestamp
  if (typeof v === 'string') {
    const t = Date.parse(v);
    return Number.isFinite(t) ? t : null;
  }
  if (typeof v === 'number') return v;
  return null;
}

export function useUserPlan(): PlanState {
  const { user, firebaseReady } = useAuth();
  const [state, setState] = useState<PlanState>({
    loading: true,
    tier: 'FREE',
    paidUntil: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // default to FREE if firebase not ready
      if (!firebaseReady || !isFirebaseReady()) {
        if (!cancelled) setState({ loading: false, tier: 'FREE', paidUntil: null });
        return;
      }

      if (!user) {
        if (!cancelled) setState({ loading: false, tier: 'FREE', paidUntil: null });
        return;
      }

      // ✅ Admin override always unlocks
      if (isAdminEmail(user.email)) {
        if (!cancelled) setState({ loading: false, tier: 'ADMIN', paidUntil: null });
        return;
      }

      try {
        const db = getFirebaseDb();
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        const data = snap.exists() ? snap.data() : {};

        const tier = normalizePlan((data as any)?.plan);
        const paidUntil = parsePaidUntil((data as any)?.paidUntil);

        // If paidUntil exists and expired => FREE
        if ((tier === 'STARTER' || tier === 'PRO') && paidUntil && paidUntil < nowMs()) {
          if (!cancelled) setState({ loading: false, tier: 'FREE', paidUntil });
          return;
        }

        if (!cancelled) setState({ loading: false, tier, paidUntil });
      } catch {
        if (!cancelled) setState({ loading: false, tier: 'FREE', paidUntil: null });
      }
    }

    // set loading true on user changes
    setState((prev) => ({ ...prev, loading: true }));
    void run();

    return () => {
      cancelled = true;
    };
  }, [user, firebaseReady]);

  return state;
}
