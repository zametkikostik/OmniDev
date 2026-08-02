import { CREDIT_COSTS, CreditAction } from './credits';

export type BillableAction = CreditAction;

export function creditsFor(action: BillableAction, tokenEstimate?: number): number {
  const base = CREDIT_COSTS[action];
  if (!tokenEstimate || tokenEstimate < 2000) return base;
  return base + Math.floor(tokenEstimate / 4000);
}

export { CREDIT_COSTS };
