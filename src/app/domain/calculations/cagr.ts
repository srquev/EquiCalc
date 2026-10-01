import { positive, finiteResult } from './validation';
export function calculateCagr(initial: number, final: number, years: number) {
  positive(initial, 'Initial investment');
  positive(final, 'Final value', true);
  positive(years, 'Years');
  return finiteResult({
    cagr: (Math.pow(final / initial, 1 / years) - 1) * 100,
    absoluteReturn: (final / initial - 1) * 100,
    profit: final - initial,
    multiple: final / initial,
  });
}
