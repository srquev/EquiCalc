import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  FormControl,
  FormRecord,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import { CALCULATORS, getCalculator } from '../../../core/config/calculators';
import { CalculationSnapshot } from '../../../core/models/calculation';
import { FavouritesStore } from '../../../core/state/favourites';
import { HistoryStore } from '../../../core/state/history';
import { RecentStore } from '../../../core/state/recent';
import { SavedStore } from '../../../core/state/saved';
import { FinancialField } from '../../../shared/components/field';
import { Icon } from '../../../shared/components/icon';
import { ResultActions } from '../../../shared/components/result-actions';
import { ResultPanel } from '../../../shared/components/result-panel';
import { SIP_FIELDS, SIP_MODES, SipMode } from './sip-config';
import { calculateSipWorkspace, SipCalculation } from './sip-calculation';
import { SipProjectionDetails } from './sip-projection-details';
import { SipComparisons } from './sip-comparisons';

const defaults: Readonly<Record<string, number | null>> = {
  monthlyContribution: null,
  targetCorpus: null,
  years: null,
  annualReturnRate: null,
  stepUpRate: null,
  stepUpIntervalMonths: 12,
  initialLumpSum: null,
  maximumMonthlyContribution: null,
  additionalMonths: null,
  contributionTiming: 0,
  inflationEnabled: 0,
  inflationRate: 6,
  delayEnabled: 0,
  delayMonths: 12,
  plannedMonthlyContribution: null,
};
@Component({
  selector: 'eq-sip-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    FinancialField,
    Icon,
    ResultActions,
    ResultPanel,
    SipProjectionDetails,
    SipComparisons,
  ],
  templateUrl: './sip-page.html',
  styleUrl: './sip-page.scss',
})
export class SipPage {
  private readonly route = inject(ActivatedRoute);
  private readonly destroy = inject(DestroyRef);
  private readonly saved = inject(SavedStore);
  private readonly history = inject(HistoryStore);
  readonly favourites = inject(FavouritesStore);
  readonly calculator = getCalculator('sip')!;
  readonly fields = SIP_FIELDS;
  readonly form = new FormRecord<FormControl<number | null>>({});
  readonly values = signal<Readonly<Record<string, number | null>>>({
    ...defaults,
  });
  readonly mode = signal<SipMode>('projection-fixed');
  readonly isGoal = computed(() => this.mode().startsWith('goal'));
  readonly isStepUp = computed(() => this.mode().endsWith('step'));
  readonly advancedOpen = signal(false);
  readonly feedback = signal('');
  readonly attempted = signal(false);
  readonly related = CALCULATORS.filter((c) =>
    ['cagr', 'investment-growth', 'average-down'].includes(c.id),
  );
  readonly outcome = computed<{
    calculation: SipCalculation | null;
    error: string;
  }>(() => {
    const v = this.values();
    if (
      [
        this.isGoal() ? 'targetCorpus' : 'monthlyContribution',
        'years',
        'annualReturnRate',
      ].some((key) => v[key] == null)
    )
      return { calculation: null, error: '' };
    try {
      return { calculation: calculateSipWorkspace(this.mode(), v), error: '' };
    } catch (error) {
      return {
        calculation: null,
        error:
          error instanceof Error ? error.message : 'Please check your inputs.',
      };
    }
  });
  readonly snapshot = computed<CalculationSnapshot>(() => ({
    calculatorId: 'sip',
    mode: this.mode(),
    inputs: this.values(),
    lots: [],
    metrics: this.outcome().calculation?.metrics ?? [],
  }));
  constructor() {
    for (const [key, value] of Object.entries(defaults)) {
      const field = Object.values(SIP_FIELDS).find((f) => f.key === key);
      this.form.addControl(
        key,
        new FormControl<number | null>(value, [
          Validators.min(field?.min ?? 0),
          Validators.max(1e15),
        ]),
      );
    }
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe(() => this.values.set(this.form.getRawValue()));
    this.form.valueChanges
      .pipe(debounceTime(1200), takeUntilDestroyed(this.destroy))
      .subscribe(() => this.record());
    inject(RecentStore).visit('sip');
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((params) => {
        const savedId = params.get('saved'),
          historyId = params.get('history');
        const item = savedId
          ? this.saved.items().find((i) => i.id === savedId)
          : historyId
            ? this.history.items().find((i) => i.id === historyId)
            : undefined;
        if (
          item?.calculatorId === 'sip' &&
          SIP_MODES.includes(item.mode as SipMode)
        ) {
          this.mode.set(item.mode as SipMode);
          this.form.reset({ ...defaults, ...item.inputs });
          this.advancedOpen.set(true);
          this.feedback.set(
            `Opened “${item.label}”. Projection recalculated from its inputs.`,
          );
        } else if (savedId || historyId)
          this.feedback.set(
            'This calculation is unavailable. Start a new projection below.',
          );
      });
  }
  control(key: string): FormControl<number | null> {
    return this.form.controls[key];
  }
  changePurpose(goal: boolean): void {
    this.mode.set(
      `${goal ? 'goal' : 'projection'}-${this.isStepUp() ? 'step' : 'fixed'}`,
    );
    this.feedback.set('');
    this.attempted.set(false);
    this.form.updateValueAndValidity();
  }
  changeStyle(step: boolean): void {
    this.mode.set(
      `${this.isGoal() ? 'goal' : 'projection'}-${step ? 'step' : 'fixed'}`,
    );
    if (step) this.advancedOpen.set(true);
    this.form.updateValueAndValidity();
  }
  toggle(key: string, enabled: boolean): void {
    this.control(key).setValue(enabled ? 1 : 0);
  }
  example(): void {
    this.mode.set(this.isGoal() ? 'goal-step' : 'projection-step');
    this.form.reset({
      ...defaults,
      monthlyContribution: 10000,
      targetCorpus: 10000000,
      years: 15,
      annualReturnRate: 12,
      stepUpRate: 10,
    });
    this.advancedOpen.set(true);
    this.feedback.set(
      'Example loaded. Change the assumptions to explore your own scenario.',
    );
  }
  reset(): void {
    this.form.reset(defaults);
    this.mode.set(this.isGoal() ? 'goal-fixed' : 'projection-fixed');
    this.advancedOpen.set(false);
    this.attempted.set(false);
    this.feedback.set(
      'Inputs reset. Optional settings are back to their defaults.',
    );
  }
  calculate(): void {
    this.attempted.set(true);
    this.form.markAllAsTouched();
    this.record();
  }
  private record(): void {
    if (this.outcome().calculation) this.history.record(this.snapshot());
  }
}
