import { CalculationSnapshot } from '../../../core/models/calculation';
import type { CalculatorConfig, FieldDefinition } from '../calculator-config';

export type SipMode =
  | 'projection-fixed'
  | 'projection-step'
  | 'goal-fixed'
  | 'goal-step';
const field = (
  key: string,
  label: string,
  unit: string,
  optional = false,
  extra: Partial<FieldDefinition> = {},
): FieldDefinition => ({ key, label, unit, optional, min: 0, ...extra });
export const SIP_FIELDS = {
  monthlyContribution: field('monthlyContribution', 'Monthly SIP', '₹'),
  targetCorpus: field('targetCorpus', 'Target corpus', '₹'),
  years: field('years', 'Investment period', 'years', false, {
    step: 1,
    hint: 'Up to 100 years. Add extra months in Advanced options.',
  }),
  annualReturnRate: field(
    'annualReturnRate',
    'Assumed annual return',
    '%',
    false,
    { min: -99.99 },
  ),
  stepUpRate: field('stepUpRate', 'SIP increase per interval', '%', true, {
    hint: 'Blank means 0%. Applies to the SIP amount, not the return.',
  }),
  stepUpIntervalMonths: field(
    'stepUpIntervalMonths',
    'Increase frequency',
    '',
    true,
    {
      options: [
        { label: 'Annually', value: 12 },
        { label: 'Every 6 months', value: 6 },
      ],
    },
  ),
  initialLumpSum: field('initialLumpSum', 'Initial lump sum', '₹', true),
  maximumMonthlyContribution: field(
    'maximumMonthlyContribution',
    'Maximum monthly SIP',
    '₹',
    true,
    { hint: 'Leave blank for no cap.' },
  ),
  additionalMonths: field(
    'additionalMonths',
    'Additional months',
    'months',
    true,
    { step: 1, hint: '0–11 months, added to the investment period.' },
  ),
  contributionTiming: field(
    'contributionTiming',
    'Contribution timing',
    '',
    true,
    {
      options: [
        { label: 'Beginning of month', value: 0 },
        { label: 'End of month', value: 1 },
      ],
    },
  ),
  inflationRate: field('inflationRate', 'Assumed inflation', '%', true, {
    hint: 'Blank means 0% inflation.',
  }),
  delayMonths: field('delayMonths', 'Start investing after', 'months', true, {
    step: 1,
    hint: 'Same end date. Both SIP and lump sum start later. Blank means no delay.',
  }),
  plannedMonthlyContribution: field(
    'plannedMonthlyContribution',
    'Current planned monthly SIP',
    '₹',
    true,
    { hint: 'Compare your current plan with the target. Leave blank to skip.' },
  ),
} satisfies Record<string, FieldDefinition>;
export const SIP_MODES: readonly SipMode[] = [
  'projection-fixed',
  'projection-step',
  'goal-fixed',
  'goal-step',
];
export const SIP_CONFIG: CalculatorConfig = {
  modes: SIP_MODES.map((id) => ({
    id,
    label: `${id.startsWith('goal') ? 'Goal planner' : 'Investment projection'} · ${id.endsWith('step') ? 'Step-Up SIP' : 'Fixed SIP'}`,
    fields: [
      id.startsWith('goal')
        ? SIP_FIELDS.targetCorpus
        : SIP_FIELDS.monthlyContribution,
      SIP_FIELDS.years,
      SIP_FIELDS.annualReturnRate,
      ...Object.values(SIP_FIELDS).filter((f) => f.optional),
    ],
    example: {},
  })),
  formula: 'Monthly rate = (1 + annual return ÷ 100)^(1 ÷ 12) − 1',
  explanation:
    'Each monthly investment has its own time to compound. Earlier contributions compound longer; later ones have less time.',
  example:
    'A 10,000 monthly SIP increasing 10% annually becomes 11,000 in year 2 and 12,100 in year 3.',
  mistake:
    'A step-up increases your contributions, not your return. Projections assume a constant return, excluding taxes, fees and inflation unless explicitly shown.',
  faq: [
    'Are these returns guaranteed?',
    'No. All outcomes are mathematical illustrations based on your inputs.',
  ],
};
export function sipSnapshotFields(
  snapshot: CalculationSnapshot,
): readonly FieldDefinition[] {
  const v = snapshot.inputs;
  return (
    SIP_CONFIG.modes.find((m) => m.id === snapshot.mode)?.fields ?? []
  ).filter((f) => {
    if (['stepUpRate', 'stepUpIntervalMonths'].includes(f.key))
      return snapshot.mode.endsWith('step') && (v['stepUpRate'] ?? 0) > 0;
    if (f.key === 'inflationRate') return v['inflationEnabled'] === 1;
    if (f.key === 'delayMonths') return v['delayEnabled'] === 1;
    if (f.key === 'plannedMonthlyContribution')
      return snapshot.mode.startsWith('goal') && v[f.key] != null;
    if (f.key === 'initialLumpSum' || f.key === 'additionalMonths')
      return (v[f.key] ?? 0) > 0;
    return true;
  });
}
