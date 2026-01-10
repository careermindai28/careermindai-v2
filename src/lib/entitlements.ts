export type PlanTier = 'FREE' | 'STARTER' | 'PRO' | 'ADMIN';

export type Entitlements = {
  plan: 'FREE' | 'STARTER' | 'PRO' | 'ADMIN';
  tier: PlanTier;
  exportLimitPerDay: number;
  watermarkOnExports: boolean;
};

export function normalizePlan(plan: any): PlanTier {
  const p = String(plan || 'FREE').toUpperCase();
  if (p === 'ADMIN') return 'ADMIN';
  if (p === 'PRO') return 'PRO';
  if (p === 'STARTER') return 'STARTER';
  if (p === 'PAID') return 'PRO'; // backward compat
  return 'FREE';
}

export function isAdminEmail(email?: string | null) {
  return (email || '').toLowerCase() === 'careermindai28@gmail.com';
}

/**
 * Export + watermark entitlements used by /api/pdf-export and others.
 */
export function getEntitlements(plan: any, email?: string | null): Entitlements {
  const admin = isAdminEmail(email);
  const tier: PlanTier = admin ? 'ADMIN' : normalizePlan(plan);

  if (tier === 'ADMIN') {
    return {
      plan: 'ADMIN',
      tier,
      exportLimitPerDay: 999999,
      watermarkOnExports: false,
    };
  }

  if (tier === 'PRO') {
    return {
      plan: 'PRO',
      tier,
      exportLimitPerDay: 999999,
      watermarkOnExports: false,
    };
  }

  if (tier === 'STARTER') {
    return {
      plan: 'STARTER',
      tier,
      exportLimitPerDay: 10,
      watermarkOnExports: true,
    };
  }

  return {
    plan: 'FREE',
    tier,
    exportLimitPerDay: 1,
    watermarkOnExports: true,
  };
}
