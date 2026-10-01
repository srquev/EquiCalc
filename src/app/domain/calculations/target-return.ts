import { positive, whole, rate, finiteResult } from './validation';
export function calculateTargetReturn(
  buy: number,
  quantity: number,
  desired: number,
  mode: 'return' | 'price' = 'return',
) {
  positive(buy, 'Purchase price');
  whole(quantity, 'Quantity');
  if (mode === 'return') rate(desired, 'Target return');
  else positive(desired, 'Target price', true);
  const targetPrice = mode === 'return' ? buy * (1 + desired / 100) : desired;
  const investment = buy * quantity,
    targetValue = targetPrice * quantity;
  return finiteResult({
    targetPrice,
    investment,
    targetValue,
    profit: targetValue - investment,
    returnPercentage: (targetPrice / buy - 1) * 100,
  });
}
