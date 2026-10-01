import { SipProjectionInput } from '../models/sip';
import { calculateRequiredSip, calculateSipProjection } from './sip-projection';
import {
  calculateDelayedStartComparison,
  calculateFixedSipComparison,
  calculateInflationAdjustedValue,
  generateReturnScenarios,
} from './sip-comparisons';
import { calculateInvestmentGrowth } from './investment-growth';
import { CalculationError } from './validation';

const base: SipProjectionInput = {
  monthlyContribution: 10000,
  durationMonths: 12,
  annualReturnRate: 0,
};
const annuity = (
  payment: number,
  annual: number,
  months: number,
  beginning: boolean,
) => {
  const r = Math.pow(1 + annual / 100, 1 / 12) - 1;
  return (
    ((payment * (Math.pow(1 + r, months) - 1)) / r) * (beginning ? 1 + r : 1)
  );
};
describe('SIP monthly projection engine', () => {
  it('has exactly 120,000 contributions and final value at 0% return', () => {
    for (const contributionTiming of ['beginning', 'end'] as const) {
      const result = calculateSipProjection({ ...base, contributionTiming });
      expect(result.finalValue).toBe(120000);
      expect(result.totalContributions).toBe(120000);
      expect(result.totalGrowth).toBe(0);
      expect(result.wealthMultiple).toBe(1);
    }
  });
  it('matches an independently calculated annuity for both payment timings', () => {
    for (const beginning of [true, false]) {
      const result = calculateSipProjection({
        ...base,
        durationMonths: 180,
        annualReturnRate: 12,
        contributionTiming: beginning ? 'beginning' : 'end',
      });
      expect(result.finalValue).toBeCloseTo(
        annuity(10000, 12, 180, beginning),
        5,
      );
      expect(result.totalContributions).toBe(1800000);
      expect(result.totalGrowth).toBeCloseTo(result.finalValue - 1800000, 8);
    }
  });
  it('gives the beginning-of-month contribution one additional month of growth', () => {
    const begin = calculateSipProjection({
      ...base,
      durationMonths: 1,
      annualReturnRate: 12,
    });
    const end = calculateSipProjection({
      ...base,
      durationMonths: 1,
      annualReturnRate: 12,
      contributionTiming: 'end',
    });
    expect(end.finalValue).toBe(10000);
    expect(begin.finalValue).toBeCloseTo(10000 * Math.pow(1.12, 1 / 12), 8);
  });
  it('applies annual increases after completed years, not in the first year', () => {
    const result = calculateSipProjection({
      ...base,
      durationMonths: 24,
      stepUpRate: 10,
    });
    expect(result.yearlyBreakdown[0].contributedThisYear).toBe(120000);
    expect(result.yearlyBreakdown[1].contributedThisYear).toBe(132000);
    expect(result.totalContributions).toBe(252000);
    expect(result.finalValue).toBe(252000);
    expect(result.finalMonthlyContribution).toBe(11000);
  });
  it('matches separately timed annual payment series for a growing SIP', () => {
    const result = calculateSipProjection({
      ...base,
      durationMonths: 24,
      annualReturnRate: 12,
      stepUpRate: 10,
    });
    const expected =
      annuity(10000, 12, 12, true) * 1.12 + annuity(11000, 12, 12, true);
    expect(result.finalValue).toBeCloseTo(expected, 6);
  });
  it('supports 0%, 5% and 10% annual increases', () => {
    for (const stepUpRate of [0, 5, 10]) {
      const result = calculateSipProjection({
        ...base,
        durationMonths: 36,
        stepUpRate,
      });
      const expected =
        120000 *
        (1 + (1 + stepUpRate / 100) + Math.pow(1 + stepUpRate / 100, 2));
      expect(result.totalContributions).toBeCloseTo(expected, 7);
    }
    expect(calculateSipProjection({ ...base, stepUpRate: 0 })).toEqual(
      calculateSipProjection(base),
    );
  });
  it('applies the full selected percentage every six months', () => {
    const result = calculateSipProjection({
      ...base,
      stepUpRate: 10,
      stepUpIntervalMonths: 6,
    });
    expect(result.finalValue).toBe(126000);
    expect(result.finalMonthlyContribution).toBe(11000);
    expect(result.yearlyBreakdown[0].startingMonthlyContribution).toBe(10000);
    const month7 = calculateSipProjection({
      ...base,
      durationMonths: 7,
      stepUpRate: 10,
      stepUpIntervalMonths: 6,
    });
    expect(month7.finalValue).toBe(71000);
  });
  it('caps every payment and never exceeds the maximum', () => {
    const result = calculateSipProjection({
      ...base,
      durationMonths: 120,
      stepUpRate: 20,
      maximumMonthlyContribution: 25000,
    });
    expect(result.finalMonthlyContribution).toBe(25000);
    expect(
      result.yearlyBreakdown.every((row) => row.monthlyContribution <= 25000),
    ).toBeTrue();
    expect(result.yearlyBreakdown[6].monthlyContribution).toBe(25000);
    expect(result.yearlyBreakdown[5].monthlyContribution).toBeCloseTo(
      24883.2,
      6,
    );
    expect(
      calculateSipProjection({
        ...base,
        durationMonths: 24,
        stepUpRate: 10,
        maximumMonthlyContribution: 10000,
      }).finalValue,
    ).toBe(240000);
  });
  it('compounds the lump sum from the beginning and separates SIP contributions', () => {
    const without = calculateSipProjection({
      ...base,
      durationMonths: 24,
      annualReturnRate: 12,
    });
    const withLump = calculateSipProjection({
      ...base,
      durationMonths: 24,
      annualReturnRate: 12,
      initialLumpSum: 200000,
    });
    expect(withLump.finalValue - without.finalValue).toBeCloseTo(
      200000 * 1.12 ** 2,
      6,
    );
    expect(withLump.sipContributions).toBe(240000);
    expect(withLump.totalContributions).toBe(440000);
    expect(withLump.yearlyBreakdown[0].contributedThisYear).toBe(120000);
  });
  it('uses exact monthly durations and includes the final partial year', () => {
    const result = calculateSipProjection({
      ...base,
      durationMonths: 15,
      stepUpRate: 10,
    });
    expect(result.yearlyBreakdown.length).toBe(2);
    expect(result.yearlyBreakdown[1].monthsInPeriod).toBe(3);
    expect(result.yearlyBreakdown[1].elapsedMonths).toBe(15);
    expect(result.finalValue).toBe(153000);
  });
  it('reconciles annual growth, contribution totals and final snapshots', () => {
    const result = calculateSipProjection({
      ...base,
      durationMonths: 181,
      annualReturnRate: 8,
      stepUpRate: 5,
      initialLumpSum: 123456,
    });
    expect(result.yearlyBreakdown.at(-1)?.endingValue).toBe(result.finalValue);
    expect(
      result.yearlyBreakdown.reduce((sum, row) => sum + row.growthThisYear, 0),
    ).toBeCloseTo(result.totalGrowth, 5);
    expect(
      result.yearlyBreakdown.reduce(
        (sum, row) => sum + row.contributedThisYear,
        result.initialLumpSum,
      ),
    ).toBeCloseTo(result.totalContributions, 5);
  });
  it('handles negative assumptions without invalid growth or negative final corpus', () => {
    const result = calculateSipProjection({
      ...base,
      durationMonths: 180,
      annualReturnRate: -10,
    });
    expect(result.totalGrowth).toBeLessThan(0);
    expect(result.finalValue).toBeGreaterThan(0);
  });
  it('supports large realistic amounts and up to 100 years', () => {
    expect(
      calculateSipProjection({
        ...base,
        monthlyContribution: 100000000,
        durationMonths: 360,
        annualReturnRate: 8,
      }).finalValue,
    ).toBeGreaterThan(36000000000);
    expect(
      calculateSipProjection({ ...base, durationMonths: 1200 }).finalValue,
    ).toBe(12000000);
    expect(
      calculateSipProjection({
        ...base,
        durationMonths: 1200,
        annualReturnRate: 12,
      }).yearlyBreakdown.length,
    ).toBe(100);
  });
  it('rejects invalid numerical values and unbounded projections', () => {
    for (const monthlyContribution of [0, -1, NaN, Infinity])
      expect(() =>
        calculateSipProjection({ ...base, monthlyContribution }),
      ).toThrowError(CalculationError);
    for (const durationMonths of [-1, 0, 1.5, 1201, NaN, Infinity])
      expect(() =>
        calculateSipProjection({ ...base, durationMonths }),
      ).toThrowError(CalculationError);
    for (const annualReturnRate of [-100, 1001, NaN, Infinity])
      expect(() =>
        calculateSipProjection({ ...base, annualReturnRate }),
      ).toThrowError(CalculationError);
    expect(() =>
      calculateSipProjection({ ...base, initialLumpSum: -1 }),
    ).toThrowError(CalculationError);
    expect(() =>
      calculateSipProjection({ ...base, stepUpRate: -1 }),
    ).toThrowError(CalculationError);
    expect(() =>
      calculateSipProjection({ ...base, maximumMonthlyContribution: 9999 }),
    ).toThrowError(CalculationError);
    expect(() =>
      calculateSipProjection({
        ...base,
        durationMonths: 1200,
        annualReturnRate: 1000,
      }),
    ).toThrowError(CalculationError);
  });
  it('keeps the existing Investment Growth results and timing consistent', () => {
    const legacy = calculateInvestmentGrowth(100000, 5000, 10, 2.5);
    const sip = calculateSipProjection({
      monthlyContribution: 5000,
      durationMonths: 30,
      annualReturnRate: 10,
      initialLumpSum: 100000,
      contributionTiming: 'end',
    });
    expect(legacy.finalValue).toBe(sip.finalValue);
    expect(legacy.contribution).toBe(sip.totalContributions);
    expect(legacy.projection.at(-1)?.year).toBe(2.5);
    expect(calculateInvestmentGrowth(100000, 0, 10, 2).finalValue).toBeCloseTo(
      121000,
      6,
    );
  });
});

describe('SIP goal planner and comparisons', () => {
  it('solves fixed SIP at zero return', () => {
    const goal = calculateRequiredSip({
      targetCorpus: 120000,
      durationMonths: 12,
      annualReturnRate: 0,
    });
    expect(goal.requiredStartingMonthlyContribution).toBeCloseTo(10000, 3);
    expect(Math.abs(goal.projection.finalValue - 120000)).toBeLessThanOrEqual(
      goal.corpusTolerance,
    );
  });
  it('round-trips goals through the forward engine with step-up, timing, lump sum and caps', () => {
    for (const stepUpRate of [0, 5, 10])
      for (const contributionTiming of ['beginning', 'end'] as const) {
        const input = {
          targetCorpus: 10000000,
          durationMonths: 180,
          annualReturnRate: 12,
          stepUpRate,
          contributionTiming,
          initialLumpSum: 100000,
          maximumMonthlyContribution: 80000,
        };
        const goal = calculateRequiredSip(input);
        const forward = calculateSipProjection({
          ...input,
          monthlyContribution: goal.requiredStartingMonthlyContribution,
        });
        expect(
          Math.abs(forward.finalValue - input.targetCorpus),
        ).toBeLessThanOrEqual(goal.corpusTolerance);
        expect(forward.finalMonthlyContribution).toBeLessThanOrEqual(80000);
      }
  });
  it('solves a six-month capped contribution schedule', () => {
    const input = {
      targetCorpus: 5000000,
      durationMonths: 183,
      annualReturnRate: 10,
      stepUpRate: 10,
      stepUpIntervalMonths: 6 as const,
      maximumMonthlyContribution: 40000,
    };
    const goal = calculateRequiredSip(input);
    expect(
      Math.abs(
        calculateSipProjection({
          ...input,
          monthlyContribution: goal.requiredStartingMonthlyContribution,
        }).finalValue - input.targetCorpus,
      ),
    ).toBeLessThanOrEqual(goal.corpusTolerance);
  });
  it('recognizes goals already funded by the lump sum', () => {
    const result = calculateRequiredSip({
      targetCorpus: 100000,
      durationMonths: 24,
      annualReturnRate: 0,
      initialLumpSum: 120000,
    });
    expect(result.requiredStartingMonthlyContribution).toBe(0);
    expect(result.initialInvestmentMeetsGoal).toBeTrue();
    expect(result.projection.finalValue).toBe(120000);
  });
  it('rejects unreachable goals and invalid targets', () => {
    expect(() =>
      calculateRequiredSip({
        targetCorpus: 200000,
        durationMonths: 12,
        annualReturnRate: 0,
        maximumMonthlyContribution: 10000,
      }),
    ).toThrowError(/cannot be reached/);
    expect(() =>
      calculateRequiredSip({
        targetCorpus: -1,
        durationMonths: 12,
        annualReturnRate: 12,
      }),
    ).toThrowError(CalculationError);
  });
  it('discounts the corpus for inflation across the exact duration', () => {
    expect(calculateInflationAdjustedValue(112360, 6, 24)).toBeCloseTo(
      100000,
      6,
    );
    expect(calculateInflationAdjustedValue(100000, 0, 18)).toBe(100000);
    expect(calculateInflationAdjustedValue(100000, 6, 18)).toBeCloseTo(
      100000 / 1.06 ** 1.5,
      7,
    );
    expect(() => calculateInflationAdjustedValue(100000, -1, 12)).toThrowError(
      CalculationError,
    );
  });
  it('generates nearby return scenarios from the same forward calculation', () => {
    const input = {
      ...base,
      annualReturnRate: 12,
      durationMonths: 180,
      stepUpRate: 10,
    };
    const rows = generateReturnScenarios(input);
    expect(rows.map((r) => r.annualReturnRate)).toEqual([8, 10, 12, 14, 16]);
    expect(rows[2].finalValue).toBe(calculateSipProjection(input).finalValue);
    expect(
      generateReturnScenarios({ ...base, annualReturnRate: -99.99 })[0]
        .annualReturnRate,
    ).toBe(-99.99);
    expect(
      generateReturnScenarios({
        ...base,
        durationMonths: 1200,
        annualReturnRate: 1000,
      }).every((r) => r.finalValue === null),
    ).toBeTrue();
  });
  it('separates additional contributions from the step-up corpus difference', () => {
    const comparison = calculateFixedSipComparison({
      ...base,
      durationMonths: 24,
      stepUpRate: 10,
    });
    expect(comparison.additionalContributions).toBe(12000);
    expect(comparison.corpusDifference).toBe(12000);
  });
  it('compares delayed investing at the same end date with a restarted step-up clock', () => {
    const result = calculateDelayedStartComparison(
      { ...base, durationMonths: 24, stepUpRate: 10, initialLumpSum: 50000 },
      12,
    );
    expect(result.startNow.finalValue).toBe(302000);
    expect(result.delayed.finalValue).toBe(170000);
    expect(result.corpusDifference).toBe(132000);
    expect(calculateDelayedStartComparison(base, 0).corpusDifference).toBe(0);
    expect(() => calculateDelayedStartComparison(base, 12)).toThrowError(
      CalculationError,
    );
    expect(() => calculateDelayedStartComparison(base, -1)).toThrowError(
      CalculationError,
    );
  });
});
