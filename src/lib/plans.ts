export type PlanKey = 'FREE' | 'STARTER' | 'PRO'

export const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    label: '₹0',
    validityDays: 0,
  },
  STARTER: {
    name: 'Starter Pass',
    price: 99,
    label: '₹99',
    validityDays: 30,
  },
  PRO: {
    name: 'Pro Pass',
    price: 199,
    label: '₹199',
    validityDays: 30,
  },
} as const
