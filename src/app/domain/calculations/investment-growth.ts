import { positive, rate, finiteResult, CalculationError } from './validation';
export function calculateInvestmentGrowth(initial: number, monthly: number, annualReturn: number, years: number) {
  positive(initial, 'Initial investment', true); positive(monthly, 'Monthly contribution', true);
  if (initial === 0 && monthly === 0) throw new CalculationError('Enter an initial investment or a monthly contribution.');
  rate(annualReturn, 'Annual return', -99.99, 1000); positive(years, 'Duration');
  if (years > 100) throw new CalculationError('Duration must be 100 years or less.');
  const months = Math.round(years * 12);
  if (months < 1) throw new CalculationError('Duration must be at least one month.');
  const monthlyRate = Math.pow(1 + annualReturn / 100, 1 / 12) - 1;
  let balance = initial;
  const projection: { year: number; contribution: number; value: number; growth: number }[] = [];
  for (let month = 1; month <= months; month++) {
    // Contributions arrive at the end of each month; the return is an effective annual rate.
    balance = balance * (1 + monthlyRate) + monthly;
    if (month % 12 === 0 || month === months) {
      const contribution = initial + monthly * month;
      projection.push({ year: month / 12, contribution, value: balance, growth: balance - contribution });
    }
  }
  const contribution = initial + monthly * months;
  return finiteResult({ contribution, growth: balance - contribution, finalValue: balance, multiple: balance / contribution, months, projection });
}
