import { PurchaseLot } from '../models/position';
import { CalculationError, whole, positive, finiteResult } from './validation';
export function calculateWeightedAverage(lots: readonly PurchaseLot[]) {
  if (!lots.length || lots.length > 50)
    throw new CalculationError('Enter between 1 and 50 purchases.');
  let quantity = 0,
    investment = 0;
  for (const lot of lots) {
    whole(lot.quantity, 'Purchase quantity');
    positive(lot.price, 'Purchase price');
    quantity += lot.quantity;
    investment += lot.quantity * lot.price;
  }
  return finiteResult({
    quantity,
    investment,
    average: investment / quantity,
    contributions: lots.map(
      (lot) => ((lot.quantity * lot.price) / investment) * 100,
    ),
  });
}
