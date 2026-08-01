export const PLANS = {
  starter: { id: 'starter', name: 'Starter', credits: 100, priceUsd: 9 },
  pro: { id: 'pro', name: 'Pro', credits: 500, priceUsd: 39 },
  team: { id: 'team', name: 'Team', credits: 2000, priceUsd: 129 },
} as const;

export type PlanId = keyof typeof PLANS;
