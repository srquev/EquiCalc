import { positive, whole, finiteResult, CalculationError } from './validation';
export function calculateDividend(quantity: number, buy: number, current: number, dividend: number, frequency = 1) {
  whole(quantity, 'Shares'); positive(buy, 'Purchase price'); positive(current, 'Current price'); positive(dividend, 'Dividend per payment', true);
  if (![1, 2, 4].includes(frequency)) throw new CalculationError('Choose annual, semiannual or quarterly payments.');
  const annualPerShare = dividend * frequency;
  return finiteResult({ costBasis: quantity * buy, currentValue: quantity * current,
    annualIncome: quantity * annualPerShare, yieldOnCost: annualPerShare / buy * 100, currentYield: annualPerShare / current * 100 });
}
