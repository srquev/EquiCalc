import { SipProjectionInput } from '../models/sip';
import { simulateCompounding } from './compounding';
import {
  CalculationError,
  finiteResult,
  positive,
  rate,
  whole,
} from './validation';

export function calculateInflationAdjustedValue(
  value: number,
  inflationRate: number,
  durationMonths: number,
): number {
  positive(value, 'Projected value', true);
  rate(inflationRate, 'Assumed inflation', 0, 100);
  whole(durationMonths, 'Duration in months');
  if (durationMonths > 1200)
    throw new CalculationError('Investment period must be 100 years or less.');
  return finiteResult(
    value / Math.pow(1 + inflationRate / 100, durationMonths / 12),
  );
}
export function generateReturnScenarios(input: SipProjectionInput) {
  const returns = [
    ...new Set(
      [-4, -2, 0, 2, 4].map((offset) =>
        Math.max(-99.99, Math.min(1000, input.annualReturnRate + offset)),
      ),
    ),
  ];
  return returns.map((annualReturnRate) => {
    try {
      return {
        annualReturnRate,
        finalValue: simulateCompounding({ ...input, annualReturnRate })
          .finalValue,
        note: '',
      };
    } catch (error) {
      return {
        annualReturnRate,
        finalValue: null,
        note:
          error instanceof Error ? error.message : 'Outside supported range.',
      };
    }
  });
}
export function calculateFixedSipComparison(input: SipProjectionInput) {
  const fixed = simulateCompounding({ ...input, stepUpRate: 0 });
  const stepUp = simulateCompounding(input);
  return {
    fixed,
    stepUp,
    additionalContributions:
      stepUp.totalContributions - fixed.totalContributions,
    corpusDifference: stepUp.finalValue - fixed.finalValue,
  };
}
export function calculateDelayedStartComparison(
  input: SipProjectionInput,
  delayMonths: number,
) {
  whole(delayMonths, 'Delay in months', true);
  if (delayMonths >= input.durationMonths)
    throw new CalculationError(
      'The start delay must be shorter than the investment period.',
    );
  const startNow = simulateCompounding(input);
  // Both the lump sum and SIP start after the delay; the step-up clock starts then too.
  const delayed = simulateCompounding({
    ...input,
    durationMonths: input.durationMonths - delayMonths,
  });
  return {
    startNow,
    delayed,
    delayMonths,
    corpusDifference: startNow.finalValue - delayed.finalValue,
  };
}
