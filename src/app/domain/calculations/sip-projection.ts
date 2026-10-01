import {
  SipGoalInput,
  SipGoalResult,
  SipProjectionInput,
  SipProjectionResult,
} from '../models/sip';
import { ProjectionLimitError, simulateCompounding } from './compounding';
import { CalculationError, positive } from './validation';

export function calculateSipProjection(
  input: SipProjectionInput,
): SipProjectionResult {
  positive(input.monthlyContribution, 'Monthly SIP');
  return simulateCompounding(input);
}

/** Bounded search; corpus tolerance is one paisa, or 16 machine epsilons at large targets. */
export function calculateRequiredSip(input: SipGoalInput): SipGoalResult {
  positive(input.targetCorpus, 'Target corpus');
  const baseline = simulateCompounding({ ...input, monthlyContribution: 0 });
  const tolerance = Math.max(0.01, input.targetCorpus * Number.EPSILON * 16);
  if (baseline.finalValue >= input.targetCorpus)
    return {
      targetCorpus: input.targetCorpus,
      requiredStartingMonthlyContribution: 0,
      projection: baseline,
      initialInvestmentMeetsGoal: true,
      corpusTolerance: tolerance,
    };
  const project = (sip: number) =>
    simulateCompounding({ ...input, monthlyContribution: sip });
  const reachesTarget = (sip: number): boolean => {
    try {
      return project(sip).finalValue >= input.targetCorpus;
    } catch (error) {
      if (error instanceof ProjectionLimitError) return true;
      throw error;
    }
  };
  const limit = input.maximumMonthlyContribution ?? 1e15;
  let high = Math.min(
    limit,
    Math.max(1, input.targetCorpus / input.durationMonths),
  );
  for (let i = 0; i < 60 && !reachesTarget(high) && high < limit; i++)
    high = Math.min(limit, high * 2);
  if (!reachesTarget(high))
    throw new CalculationError(
      'The target cannot be reached within the maximum monthly SIP under these assumptions. Adjust the target, period or cap.',
    );
  let low = 0;
  for (let i = 0; i < 100; i++) {
    const middle = (low + high) / 2;
    if (middle === low || middle === high) break;
    if (reachesTarget(middle)) high = middle;
    else low = middle;
    try {
      if (project(high).finalValue - input.targetCorpus <= tolerance) break;
    } catch (error) {
      if (!(error instanceof ProjectionLimitError)) throw error;
    }
  }
  const projection = project(high);
  if (Math.abs(projection.finalValue - input.targetCorpus) > tolerance)
    throw new CalculationError(
      'The goal cannot be resolved within the supported precision. Try a smaller target.',
    );
  return {
    targetCorpus: input.targetCorpus,
    requiredStartingMonthlyContribution: high,
    projection,
    initialInvestmentMeetsGoal: false,
    corpusTolerance: tolerance,
  };
}
