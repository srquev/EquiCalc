import { simulateCompounding } from './compounding';
import { positive, rate, CalculationError } from './validation';
export function calculateInvestmentGrowth(
  initial: number,
  monthly: number,
  annualReturn: number,
  years: number,
) {
  positive(initial, 'Initial investment', true);
  positive(monthly, 'Monthly contribution', true);
  if (initial === 0 && monthly === 0)
    throw new CalculationError(
      'Enter an initial investment or a monthly contribution.',
    );
  rate(annualReturn, 'Annual return', -99.99, 1000);
  positive(years, 'Duration');
  if (years > 100)
    throw new CalculationError('Duration must be 100 years or less.');
  const months = Math.round(years * 12);
  if (months < 1)
    throw new CalculationError('Duration must be at least one month.');
  const result = simulateCompounding({
    monthlyContribution: monthly,
    initialLumpSum: initial,
    durationMonths: months,
    annualReturnRate: annualReturn,
    contributionTiming: 'end',
  });
  return {
    contribution: result.totalContributions,
    growth: result.totalGrowth,
    finalValue: result.finalValue,
    multiple: result.wealthMultiple,
    months,
    projection: result.yearlyBreakdown.map((row) => ({
      year: row.elapsedMonths / 12,
      contribution: row.totalContributed,
      value: row.endingValue,
      growth: row.totalGrowth,
    })),
  };
}
