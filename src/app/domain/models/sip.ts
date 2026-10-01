export interface SipProjectionInput {
  readonly monthlyContribution: number;
  readonly durationMonths: number;
  /** Effective annual return, expressed as a percentage (12 means 12%). */
  readonly annualReturnRate: number;
  readonly stepUpRate?: number;
  /** The step-up percentage applies at each selected interval. */
  readonly stepUpIntervalMonths?: 6 | 12;
  readonly initialLumpSum?: number;
  readonly maximumMonthlyContribution?: number;
  readonly contributionTiming?: 'beginning' | 'end';
}
export interface SipYearResult {
  readonly year: number;
  readonly elapsedMonths: number;
  readonly monthsInPeriod: number;
  readonly startingMonthlyContribution: number;
  readonly monthlyContribution: number;
  readonly contributedThisYear: number;
  readonly totalContributed: number;
  readonly growthThisYear: number;
  readonly totalGrowth: number;
  readonly endingValue: number;
}
export interface SipProjectionResult {
  readonly totalContributions: number;
  readonly sipContributions: number;
  readonly initialLumpSum: number;
  readonly totalGrowth: number;
  readonly finalValue: number;
  readonly startingMonthlyContribution: number;
  readonly finalMonthlyContribution: number;
  readonly totalMonths: number;
  readonly wealthMultiple: number;
  readonly yearlyBreakdown: readonly SipYearResult[];
}
export interface SipGoalInput
  extends Omit<SipProjectionInput, 'monthlyContribution'> {
  readonly targetCorpus: number;
}
export interface SipGoalResult {
  readonly targetCorpus: number;
  readonly requiredStartingMonthlyContribution: number;
  readonly projection: SipProjectionResult;
  readonly initialInvestmentMeetsGoal: boolean;
  readonly corpusTolerance: number;
}
