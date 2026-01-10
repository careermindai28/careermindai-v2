'use client';

import { ReactNode, useMemo, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import UpgradeModal from '@/components/billing/UpgradeModal';
import { useUserPlan, PlanTier } from '@/hooks/useUserPlan';
import RequireAuth from '@/components/auth/RequireAuth';

type Props = {
  minTier: Exclude<PlanTier, 'FREE'>;
  message?: string;
  children: ReactNode;
};

function tierRank(t: PlanTier) {
  if (t === 'ADMIN') return 3;
  if (t === 'PRO') return 2;
  if (t === 'STARTER') return 1;
  return 0;
}

export default function RequirePlan({ minTier, message, children }: Props) {
  const { user } = useAuth();
  const plan = useUserPlan();
  const [open, setOpen] = useState(false);

  const ok = useMemo(() => {
    if (!user) return false;
    if (plan.loading) return false;
    return tierRank(plan.tier) >= tierRank(minTier);
  }, [user, plan.loading, plan.tier, minTier]);

  return (
    <RequireAuth>
      {!plan.loading && !ok ? (
        <>
          <div className="max-w-4xl mx-auto p-6">
            <div className="rounded-2xl border border-border bg-surface p-6">
              <div className="text-xl font-semibold text-foreground">Unlock this tool</div>
              <p className="mt-2 text-sm text-text-secondary">
                {message ||
                  `This feature is available on the ${
                    minTier === 'PRO' ? 'Pro Pass' : 'Starter Pass'
                  }.`}
              </p>
              <button
                onClick={() => setOpen(true)}
                className="mt-4 px-5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold"
              >
                Upgrade now
              </button>
            </div>
          </div>

          <UpgradeModal open={open} onClose={() => setOpen(false)} message={message} />
        </>
      ) : (
        children
      )}
    </RequireAuth>
  );
}
