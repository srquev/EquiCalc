import { positive, finiteResult, CalculationError } from './validation';
export function calculateMarketCap(price: number, shares: number, unit = 1) {
  positive(price, 'Share price'); positive(shares, 'Outstanding shares');
  if (![1, 1000, 100000, 10000000, 1000000, 1000000000].includes(unit)) throw new CalculationError('Choose a supported share unit.');
  return finiteResult({ marketCap: price * shares * unit, outstandingShares: shares * unit });
}
