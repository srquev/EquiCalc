import { positive, whole, finiteResult } from './validation';
export function calculateProfitLoss(
  buy: number,
  sell: number,
  quantity: number,
  charges = 0,
) {
  positive(buy, 'Purchase price');
  positive(sell, 'Current / sell price', true);
  whole(quantity, 'Quantity');
  positive(charges, 'Charges', true);
  const investment = buy * quantity,
    value = sell * quantity;
  const grossPnl = value - investment,
    netPnl = grossPnl - charges;
  return finiteResult({
    investment,
    value,
    grossPnl,
    charges,
    netPnl,
    returnPercentage: (netPnl / investment) * 100,
  });
}
