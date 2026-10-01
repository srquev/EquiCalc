import { positive, whole, finiteResult } from './validation';
export function calculateBonus(quantity: number, average: number, bonus: number, held: number) {
  whole(quantity, 'Existing shares'); positive(average, 'Average cost'); whole(bonus, 'Bonus ratio'); whole(held, 'Held ratio');
  const entitlement = quantity * bonus / held, bonusShares = Math.floor(entitlement), totalShares = quantity + bonusShares;
  return finiteResult({ entitlement, bonusShares, fractionalEntitlement: entitlement - bonusShares, totalShares,
    adjustedAverage: quantity * average / totalShares, originalCost: quantity * average });
}
