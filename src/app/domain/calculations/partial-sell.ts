import { positive, whole, finiteResult, CalculationError } from './validation';
export function calculatePartialSell(quantity: number, average: number, current: number, amount: number, mode: 'quantity' | 'withdraw' = 'quantity') {
  whole(quantity, 'Total shares'); positive(average, 'Average price'); positive(current, 'Current price');
  if (mode === 'quantity') whole(amount, 'Shares to sell'); else positive(amount, 'Withdrawal amount');
  const sharesSold = mode === 'quantity' ? amount : Math.ceil(amount / current);
  if (sharesSold > quantity) throw new CalculationError('The sale exceeds the shares in this position.');
  const remainingShares = quantity - sharesSold;
  return finiteResult({ originalCost: quantity * average, sharesSold, proceeds: sharesSold * current,
    realisedPnl: sharesSold * (current - average), remainingShares, remainingCost: remainingShares * average,
    remainingValue: remainingShares * current });
}
