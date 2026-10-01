import { purchasableShares } from './whole-shares';
import { InvestorPosition } from '../models/position';
import { calculatePosition } from './position';
import { calculateRecovery } from './break-even';
import { CalculationError, positive, finiteResult } from './validation';
export function calculateAverageDown(
  position: InvestorPosition,
  budget: number,
) {
  const original = calculatePosition(position);
  positive(position.currentPrice, 'Current price');
  positive(budget, 'Additional investment', true);
  const additionalShares = purchasableShares(budget, position.currentPrice);
  const additionalInvestmentUsed = additionalShares * position.currentPrice;
  const totalQuantity = position.quantity + additionalShares;
  const totalInvestment = original.investment + additionalInvestmentUsed;
  const newAverage = totalInvestment / totalQuantity;
  return finiteResult({
    currentInvestment: original.investment,
    currentValue: original.value,
    currentPnl: original.netPnl,
    currentPnlPercentage: original.returnPercentage,
    additionalShares,
    additionalInvestmentUsed,
    unusedCapital: Math.max(0, budget - additionalInvestmentUsed),
    totalQuantity,
    totalInvestment,
    newAverage,
    averageReduction: position.averagePrice - newAverage,
    averageReductionPercentage: (1 - newAverage / position.averagePrice) * 100,
    oldRecoveryPercentage: calculateRecovery(
      position.averagePrice,
      position.currentPrice,
    ),
    newRecoveryPercentage: calculateRecovery(newAverage, position.currentPrice),
  });
}
export function calculateTargetAverage(
  position: InvestorPosition,
  target: number,
) {
  calculatePosition(position);
  positive(position.currentPrice, 'Current price');
  positive(target, 'Desired average');
  if (target >= position.averagePrice)
    throw new CalculationError(
      'Desired average must be below your current average.',
    );
  if (target <= position.currentPrice)
    throw new CalculationError(
      `Target cannot be achieved by purchasing at the current price. The weighted average approaches the purchase price but cannot reach or fall below it.`,
    );
  const exactShares =
    (position.quantity * (position.averagePrice - target)) /
    (target - position.currentPrice);
  // Round up to meet or better the requested target with whole shares.
  let shares = Math.ceil(exactShares);
  const averageFor = (q: number) =>
    (position.quantity * position.averagePrice + q * position.currentPrice) /
    (position.quantity + q);
  if (shares > 0 && averageFor(shares - 1) <= target) shares--;
  if (averageFor(shares) > target) shares++;
  const investmentRequired = shares * position.currentPrice;
  const result = calculateAverageDown(position, investmentRequired);
  return finiteResult({
    ...result,
    unusedCapital: 0,
    requestedAverage: target,
    investmentRequired,
    differenceFromTarget: result.newAverage - target,
  });
}
export function calculateAveragingScenarios(
  position: InvestorPosition,
  budget: number,
) {
  positive(budget, 'Scenario budget');
  return [0.25, 0.5, 1, 1.5, 2.5].map((multiplier) => {
    const scenarioBudget = budget * multiplier;
    return {
      budget: scenarioBudget,
      ...calculateAverageDown(position, scenarioBudget),
    };
  });
}
