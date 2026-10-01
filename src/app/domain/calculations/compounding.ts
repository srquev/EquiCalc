import {
  SipProjectionInput,
  SipProjectionResult,
  SipYearResult,
} from '../models/sip';
import {
  CalculationError,
  finiteResult,
  positive,
  rate,
  whole,
} from './validation';

export class ProjectionLimitError extends CalculationError {}
export const MAX_PROJECTION_MONTHS = 1200;

export function validateProjectionInput(input: SipProjectionInput): void {
  positive(input.monthlyContribution, 'Monthly contribution', true);
  whole(input.durationMonths, 'Duration in months');
  if (input.durationMonths > MAX_PROJECTION_MONTHS)
    throw new CalculationError('Investment period must be 100 years or less.');
  rate(input.annualReturnRate, 'Assumed annual return', -99.99, 1000);
  positive(input.initialLumpSum ?? 0, 'Initial lump sum', true);
  rate(input.stepUpRate ?? 0, 'SIP increase', 0, 100);
  if (![6, 12].includes(input.stepUpIntervalMonths ?? 12))
    throw new CalculationError(
      'SIP increases must occur annually or every 6 months.',
    );
  if (!['beginning', 'end'].includes(input.contributionTiming ?? 'beginning'))
    throw new CalculationError(
      'Choose beginning or end of month for contributions.',
    );
  if (input.maximumMonthlyContribution !== undefined) {
    positive(input.maximumMonthlyContribution, 'Maximum monthly SIP');
    if (input.maximumMonthlyContribution < input.monthlyContribution)
      throw new CalculationError(
        'Maximum SIP cannot be below the starting monthly SIP.',
      );
  }
}

/** Shared source of truth. Zero SIP is allowed for lump-sum-only and goal projections. */
export function simulateCompounding(
  input: SipProjectionInput,
): SipProjectionResult {
  validateProjectionInput(input);
  const initial = input.initialLumpSum ?? 0;
  const monthlyRate = Math.expm1(Math.log1p(input.annualReturnRate / 100) / 12);
  const step = input.stepUpRate ?? 0;
  const interval = input.stepUpIntervalMonths ?? 12;
  const timing = input.contributionTiming ?? 'beginning';
  let balance = initial;
  let sip = input.monthlyContribution;
  let sipContributions = 0;
  let previousValue = initial;
  let previousContributions = initial;
  let periodStartingSip = sip;
  const yearlyBreakdown: SipYearResult[] = [];
  for (let month = 1; month <= input.durationMonths; month++) {
    if (month > 1 && (month - 1) % interval === 0) {
      sip *= 1 + step / 100;
      if (input.maximumMonthlyContribution !== undefined)
        sip = Math.min(sip, input.maximumMonthlyContribution);
    }
    if ((month - 1) % 12 === 0) periodStartingSip = sip;
    if (timing === 'beginning') balance += sip;
    balance *= 1 + monthlyRate;
    if (timing === 'end') balance += sip;
    sipContributions += sip;
    const totalContributed = initial + sipContributions;
    if (
      !Number.isFinite(balance) ||
      balance > Number.MAX_SAFE_INTEGER ||
      totalContributed > Number.MAX_SAFE_INTEGER
    ) {
      throw new ProjectionLimitError(
        'These assumptions exceed the supported numerical precision. Reduce the amount, return or duration.',
      );
    }
    if (month % 12 === 0 || month === input.durationMonths) {
      const contributedThisYear = totalContributed - previousContributions;
      yearlyBreakdown.push({
        year: Math.ceil(month / 12),
        elapsedMonths: month,
        monthsInPeriod: month % 12 || 12,
        startingMonthlyContribution: periodStartingSip,
        monthlyContribution: sip,
        contributedThisYear,
        totalContributed,
        growthThisYear: balance - previousValue - contributedThisYear,
        totalGrowth: balance - totalContributed,
        endingValue: balance,
      });
      previousValue = balance;
      previousContributions = totalContributed;
    }
  }
  const totalContributions = initial + sipContributions;
  return finiteResult({
    totalContributions,
    sipContributions,
    initialLumpSum: initial,
    totalGrowth: balance - totalContributions,
    finalValue: balance,
    startingMonthlyContribution: input.monthlyContribution,
    finalMonthlyContribution: sip,
    totalMonths: input.durationMonths,
    wealthMultiple: totalContributions === 0 ? 0 : balance / totalContributions,
    yearlyBreakdown,
  });
}
