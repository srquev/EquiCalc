import { CalculationMetric } from '../../../core/models/calculation';
import {
  SipGoalResult,
  SipProjectionInput,
  SipProjectionResult,
} from '../../../domain/models/sip';
import {
  calculateRequiredSip,
  calculateSipProjection,
} from '../../../domain/calculations/sip-projection';
import { simulateCompounding } from '../../../domain/calculations/compounding';
import {
  calculateDelayedStartComparison,
  calculateInflationAdjustedValue,
} from '../../../domain/calculations/sip-comparisons';
import {
  CalculationError,
  whole,
} from '../../../domain/calculations/validation';
import { metric } from '../calculate';
import { SipMode } from './sip-config';

export interface SipCalculation {
  readonly input: SipProjectionInput;
  readonly projection: SipProjectionResult;
  readonly goal: SipGoalResult | null;
  readonly metrics: readonly CalculationMetric[];
  readonly realValue: number | null;
  readonly inflationRate: number | null;
  readonly delayed: ReturnType<typeof calculateDelayedStartComparison> | null;
  readonly planned: SipProjectionResult | null;
}
export function calculateSipWorkspace(
  mode: SipMode,
  values: Readonly<Record<string, number | null>>,
): SipCalculation {
  const n = (key: string) => values[key] ?? 0;
  whole(n('years'), 'Investment period in years', true);
  whole(n('additionalMonths'), 'Additional months', true);
  if (n('additionalMonths') > 11)
    throw new CalculationError('Additional months must be between 0 and 11.');
  const timing = values['contributionTiming'] ?? 0;
  if (![0, 1].includes(timing))
    throw new CalculationError('Choose a valid contribution timing.');
  const interval = values['stepUpIntervalMonths'] ?? 12;
  if (![6, 12].includes(interval))
    throw new CalculationError('Choose annual or six-month SIP increases.');
  const base: SipProjectionInput = {
    monthlyContribution: n('monthlyContribution'),
    durationMonths: n('years') * 12 + n('additionalMonths'),
    annualReturnRate: n('annualReturnRate'),
    stepUpRate: mode.endsWith('step') ? n('stepUpRate') : 0,
    stepUpIntervalMonths: interval as 6 | 12,
    initialLumpSum: n('initialLumpSum'),
    maximumMonthlyContribution:
      values['maximumMonthlyContribution'] ?? undefined,
    contributionTiming: timing === 0 ? 'beginning' : 'end',
  };
  const goal = mode.startsWith('goal')
    ? calculateRequiredSip({ ...base, targetCorpus: n('targetCorpus') })
    : null;
  const input = {
    ...base,
    monthlyContribution: goal
      ? goal.requiredStartingMonthlyContribution
      : base.monthlyContribution,
  };
  const projection = goal?.projection ?? calculateSipProjection(input);
  const inflationRate = n('inflationEnabled') === 1 ? n('inflationRate') : null;
  const realValue =
    inflationRate === null
      ? null
      : calculateInflationAdjustedValue(
          projection.finalValue,
          inflationRate,
          input.durationMonths,
        );
  const delayed =
    n('delayEnabled') === 1
      ? calculateDelayedStartComparison(input, n('delayMonths'))
      : null;
  const planned =
    goal && values['plannedMonthlyContribution'] != null
      ? simulateCompounding({
          ...input,
          monthlyContribution: n('plannedMonthlyContribution'),
        })
      : null;
  const metrics = [
    ...(goal
      ? [
          metric(
            'Required starting monthly SIP',
            goal.requiredStartingMonthlyContribution,
          ),
          metric('Target corpus', goal.targetCorpus),
          metric('Estimated final value', projection.finalValue),
        ]
      : [metric('Estimated final value', projection.finalValue)]),
    metric('Total contributions', projection.totalContributions),
    metric('Estimated growth', projection.totalGrowth, 'currency', true),
    metric('Wealth multiple', projection.wealthMultiple, 'number'),
    metric('Starting monthly SIP', projection.startingMonthlyContribution),
    ...(input.stepUpRate
      ? [
          metric('Final monthly SIP', projection.finalMonthlyContribution),
          metric(
            input.stepUpIntervalMonths === 6
              ? 'SIP increase every 6 months'
              : 'Annual SIP step-up',
            input.stepUpRate,
            'percentage',
          ),
        ]
      : []),
    metric('Total months', projection.totalMonths, 'number'),
    metric('Total SIP contributions', projection.sipContributions),
    metric('Assumed annual return', input.annualReturnRate, 'percentage'),
    ...(projection.initialLumpSum
      ? [metric('Initial lump sum', projection.initialLumpSum)]
      : []),
    ...(realValue === null
      ? []
      : [
          metric('Today’s purchasing-power equivalent', realValue),
          metric('Assumed inflation', inflationRate!, 'percentage'),
        ]),
    ...(planned && goal
      ? [
          metric('Current plan: estimated corpus', planned.finalValue),
          metric(
            'Current plan: gap to target',
            goal.targetCorpus - planned.finalValue,
          ),
        ]
      : []),
    ...(delayed
      ? [
          metric('Delayed start: estimated corpus', delayed.delayed.finalValue),
          metric(
            'Start now minus delayed: corpus difference',
            delayed.corpusDifference,
          ),
        ]
      : []),
  ];
  return {
    input,
    projection,
    goal,
    metrics,
    inflationRate,
    realValue,
    delayed,
    planned,
  };
}
