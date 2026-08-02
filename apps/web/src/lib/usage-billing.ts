export const COST = {
  generate: 5,
  edit: 2,
  chat: 1,
  heal: 2,
  vision: 4,
} as const;

export type BillableAction = keyof typeof COST;

export function creditsFor(action: BillableAction, tokenEstimate?: number): number {
  const base = COST[action];
  if (!tokenEstimate || tokenEstimate < 2000) return base;
  return base + Math.floor(tokenEstimate / 4000);
}
