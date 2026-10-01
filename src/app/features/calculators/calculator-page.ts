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
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  FormRecord,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, merge } from 'rxjs';
import { CALCULATORS, getCalculator } from '../../core/config/calculators';
import { CalculationSnapshot } from '../../core/models/calculation';
import { FavouritesStore } from '../../core/state/favourites';
import { PositionStore } from '../../core/state/position';
import { RecentStore } from '../../core/state/recent';
import { SavedStore } from '../../core/state/saved';
import { HistoryStore } from '../../core/state/history';
import { Icon } from '../../shared/components/icon';
import { FinancialField } from '../../shared/components/field';
import { ResultPanel } from '../../shared/components/result-panel';
import { ResultActions } from '../../shared/components/result-actions';
import { CONFIGS, FieldDefinition } from './calculator-config';
import { MetricPipe } from '../../core/utilities/format';
import { calculatePosition } from '../../domain/calculations/position';
import { calculateMetrics, toPosition } from './calculate';
import { AverageDownDetails } from './average-down-details';
import { CalculatorSupplement } from './calculator-supplement';
const integer = (control: AbstractControl) =>
  control.value === null || Number.isInteger(control.value)
    ? null
    : { integer: true };
const lot = (quantity: number | null = null, price: number | null = null) =>
  new FormGroup({
    quantity: new FormControl(quantity, [
      Validators.required,
      Validators.min(1),
      integer,
    ]),
    price: new FormControl(price, [
      Validators.required,
      Validators.min(Number.MIN_VALUE),
    ]),
  });
@Component({
  selector: 'eq-calculator-page',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    Icon,
    FinancialField,
    ResultPanel,
    ResultActions,
    AverageDownDetails,
    CalculatorSupplement,
    MetricPipe,
  ],
  templateUrl: './calculator-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .purchase-row {
      padding: 18px 0;
      border-top: 1px solid var(--eq-border);
    }
    .purchase-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 7px;
      font-size: 11px;
      color: var(--eq-text-secondary);
    }
    .purchase-header .icon-button {
      width: 36px;
      min-height: 36px;
    }
    .add-purchase {
      width: 100%;
      border-style: dashed;
      margin-top: 15px;
    }
    .page-header .icon-tile {
      margin-bottom: 15px;
    }
    .calculator-title-row .icon-button {
      border: 1px solid var(--eq-border);
      background: var(--eq-surface);
    }
    .page-header .category-label {
      display: inline-block;
      margin-left: 12px;
      vertical-align: middle;
    }
    .inputs-caption {
      font-size: 10px;
      color: var(--eq-text-muted);
      margin-bottom: 0;
    }
    .save-privacy {
      font-size: 10px;
      color: var(--eq-text-muted);
      margin-top: 12px;
    }
    .read-note {
      color: var(--eq-text-muted);
      font-size: 11px;
      line-height: 1.7;
    }
  `,
})
export class CalculatorPage {
  private readonly route = inject(ActivatedRoute);
  private readonly destroy = inject(DestroyRef);
  readonly id = this.route.snapshot.data['calculatorId'] as string;
  readonly calculator = getCalculator(this.id)!;
  readonly config = CONFIGS[this.id];
  readonly favourites = inject(FavouritesStore);
  readonly positions = inject(PositionStore);
  private readonly saved = inject(SavedStore);
  private readonly history = inject(HistoryStore);
  readonly mode = signal(this.config.modes[0].id);
  readonly activeMode = computed(
    () => this.config.modes.find((m) => m.id === this.mode())!,
  );
  readonly form = new FormRecord<FormControl<number | null>>({});
  readonly lots = new FormArray([lot()]);
  readonly values = signal<Readonly<Record<string, number | null>>>({});
  readonly purchases = signal<readonly { quantity: number; price: number }[]>(
    [],
  );
  readonly feedback = signal('');
  readonly attempted = signal(false);
  readonly quantityField: FieldDefinition = {
    key: 'quantity',
    label: 'Quantity',
    unit: 'shares',
    min: 1,
    step: 1,
  };
  readonly priceField: FieldDefinition = {
    key: 'price',
    label: 'Purchase price',
    unit: '₹',
    min: 0,
  };
  readonly positionSummary = computed(() => {
    try {
      return calculatePosition(this.position());
    } catch {
      return null;
    }
  });
  readonly position = computed(() => toPosition(this.values()));
  readonly outcome = computed(() => {
    const values = this.values();
    if (this.id === 'stock-average') {
      if (
        !this.purchases().length ||
        this.purchases().some((l) => !l.quantity || !l.price)
      )
        return { metrics: [], error: '' };
    } else if (
      this.activeMode().fields.some((f) => !f.optional && values[f.key] == null)
    )
      return { metrics: [], error: '' };
    try {
      return {
        metrics: calculateMetrics(
          this.id,
          this.mode(),
          values,
          this.purchases(),
        ),
        error: '',
      };
    } catch (error) {
      return {
        metrics: [],
        error:
          error instanceof Error ? error.message : 'Please check your inputs.',
      };
    }
  });
  readonly snapshot = computed<CalculationSnapshot>(() => ({
    calculatorId: this.id,
    mode: this.mode(),
    inputs: this.values(),
    lots: this.purchases(),
    metrics: this.outcome().metrics,
  }));
  readonly related = CALCULATORS.filter(
    (c) =>
      c.id !== this.id &&
      (c.category === this.calculator.category || c.featured),
  ).slice(0, 3);
  constructor() {
    this.setupForm();
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe(() => this.sync());
    this.lots.valueChanges
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe(() => this.sync());
    merge(this.form.valueChanges, this.lots.valueChanges)
      .pipe(debounceTime(1200), takeUntilDestroyed(this.destroy))
      .subscribe(() => this.record());
    inject(RecentStore).visit(this.id);
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((params) => {
        const savedId = params.get('saved');
        const historyId = params.get('history');
        const item = savedId
          ? this.saved.items().find((i) => i.id === savedId)
          : historyId
            ? this.history.items().find((i) => i.id === historyId)
            : undefined;
        if (item && item.calculatorId === this.id) {
          this.mode.set(
            this.config.modes.some((m) => m.id === item.mode)
              ? item.mode
              : this.config.modes[0].id,
          );
          this.setupForm();
          this.form.patchValue(item.inputs);
          if (this.id === 'stock-average' && item.lots.length) {
            this.lots.clear();
            item.lots.forEach((l) => this.lots.push(lot(l.quantity, l.price)));
          }
          this.sync();
          this.feedback.set(
            `Opened “${item.label}”. Results are recalculated from its inputs.`,
          );
        } else if (savedId || historyId)
          this.feedback.set(
            'This saved calculation is unavailable. You can start a new calculation below.',
          );
      });
  }
  private setupForm(): void {
    const old = this.form.getRawValue();
    Object.keys(this.form.controls).forEach((key) =>
      this.form.removeControl(key, { emitEvent: false }),
    );
    for (const field of this.activeMode().fields) {
      const validators = [
        ...(!field.optional ? [Validators.required] : []),
        Validators.min(field.min ?? 0),
        Validators.max(1e15),
        ...(field.step === 1 ? [integer] : []),
      ];
      this.form.addControl(
        field.key,
        new FormControl<number | null>(
          old[field.key] ?? field.options?.[0].value ?? null,
          validators,
        ),
        { emitEvent: false },
      );
    }
    this.sync();
  }
  private sync(): void {
    this.values.set(this.form.getRawValue());
    this.purchases.set(
      this.id === 'stock-average'
        ? this.lots
            .getRawValue()
            .map((l) => ({ quantity: l.quantity ?? 0, price: l.price ?? 0 }))
        : [],
    );
  }
  control(key: string): FormControl<number | null> {
    return this.form.controls[key];
  }
  switchMode(id: string): void {
    this.mode.set(id);
    this.setupForm();
    this.feedback.set('');
    this.attempted.set(false);
  }
  addLot(): void {
    if (this.lots.length < 50) this.lots.push(lot());
  }
  removeLot(index: number): void {
    if (this.lots.length > 1) this.lots.removeAt(index);
  }
  example(): void {
    if (this.id === 'stock-average') {
      this.lots.clear();
      this.lots.push(lot(100, 500));
      this.lots.push(lot(100, 400));
    } else this.form.patchValue(this.activeMode().example);
    this.sync();
    this.feedback.set(
      'Example loaded. Change any value to explore your own scenario.',
    );
  }
  reset(): void {
    this.form.reset();
    this.activeMode().fields.forEach((f) => {
      if (f.options) this.control(f.key).setValue(f.options[0].value);
    });
    this.lots.clear();
    this.lots.push(lot());
    this.sync();
    this.feedback.set('Inputs reset.');
    this.attempted.set(false);
  }
  usePosition(): void {
    const p = this.positions.position();
    if (!p) return;
    const v = {
      quantity: p.quantity,
      average: p.averagePrice,
      current: p.currentPrice,
    };
    Object.entries(v).forEach(([key, value]) =>
      this.form.controls[key]?.setValue(value),
    );
    this.feedback.set('Your current position has been applied.');
  }
  calculate(): void {
    this.form.markAllAsTouched();
    this.lots.markAllAsTouched();
    this.attempted.set(true);
    this.sync();
    this.record();
    if (this.outcome().metrics.length)
      this.feedback.set('Calculation updated. Results respond as you edit.');
  }
  private record(): void {
    if (this.outcome().metrics.length) this.history.record(this.snapshot());
  }
}
