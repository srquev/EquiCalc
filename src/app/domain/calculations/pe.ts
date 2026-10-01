import { positive, rate, finiteResult, CalculationError } from './validation';
export function calculatePe(price: number, eps: number) {
  positive(price, 'Share price'); rate(eps, 'EPS', -1e12, 1e12);
  if (eps === 0) throw new CalculationError('P/E is undefined when EPS is zero.');
  return finiteResult({ pe: eps < 0 ? null : price / eps, eps, price,
    note: eps < 0 ? 'P/E is not meaningful for negative earnings.' : 'P/E is a ratio, not a valuation recommendation.' });
}
export function calculateEps(price: number, pe: number) {
  positive(price, 'Share price'); positive(pe, 'P/E'); return finiteResult({ eps: price / pe });
}
export function calculateImpliedPrice(eps: number, pe: number) {
  positive(eps, 'EPS'); positive(pe, 'P/E'); return finiteResult({ price: eps * pe });
}
