import { positive, whole, finiteResult } from './validation';
export function calculateRecovery(average: number, current: number): number {
  positive(average, 'Average price');
  positive(current, 'Current price');
  return finiteResult(Math.max(0, (average / current - 1) * 100));
}
export function calculateBreakEven(
  average: number,
  current: number,
  quantity?: number,
) {
  positive(average, 'Average price');
  positive(current, 'Current price', true);
  if (quantity !== undefined) whole(quantity, 'Quantity');
  return finiteResult({
    breakEven: average,
    priceDifference: current - average,
    returnPercentage: (current / average - 1) * 100,
    recovery: current === 0 ? null : calculateRecovery(average, current),
    pnl: quantity === undefined ? null : (current - average) * quantity,
  });
}
