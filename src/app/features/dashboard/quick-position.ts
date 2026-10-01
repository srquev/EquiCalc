import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { PositionStore } from '../../core/state/position';
import { calculatePosition } from '../../domain/calculations/position';
import { FinancialField } from '../../shared/components/field';
import { Icon } from '../../shared/components/icon';
import { MetricPipe } from '../../core/utilities/format';
import { FieldDefinition } from '../calculators/calculator-config';
@Component({
  selector: 'eq-quick-position',
  imports: [RouterLink, ReactiveFormsModule, FinancialField, Icon, MetricPipe],
  templateUrl: './quick-position.html',
  styleUrl: './quick-position.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickPosition {
  readonly positions = inject(PositionStore);
  readonly message = signal('');
  private readonly initial = this.positions.position() ?? {
    quantity: 100,
    averagePrice: 500,
    currentPrice: 350,
  };
  readonly example = !this.positions.position();
  readonly form = new FormGroup({
    quantity: new FormControl<number | null>(this.initial.quantity, [
      Validators.required,
      Validators.min(1),
    ]),
    averagePrice: new FormControl<number | null>(this.initial.averagePrice, [
      Validators.required,
      Validators.min(0.000001),
    ]),
    currentPrice: new FormControl<number | null>(this.initial.currentPrice, [
      Validators.required,
      Validators.min(0),
    ]),
  });
  readonly values = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });
  readonly fields: readonly (FieldDefinition & {
    key: 'quantity' | 'averagePrice' | 'currentPrice';
  })[] = [
    { key: 'quantity', label: 'Quantity', unit: 'shares', min: 1, step: 1 },
    { key: 'averagePrice', label: 'Average price', unit: '₹', min: 0 },
    { key: 'currentPrice', label: 'Current market price', unit: '₹', min: 0 },
  ];
  readonly result = computed(() => {
    const v = this.values();
    if (v.quantity == null || v.averagePrice == null || v.currentPrice == null)
      return null;
    try {
      return calculatePosition({
        quantity: v.quantity,
        averagePrice: v.averagePrice,
        currentPrice: v.currentPrice,
      });
    } catch {
      return null;
    }
  });
  usePosition(): void {
    const v = this.form.getRawValue();
    if (
      this.result() &&
      v.quantity !== null &&
      v.averagePrice !== null &&
      v.currentPrice !== null
    ) {
      this.positions.set({
        quantity: v.quantity,
        averagePrice: v.averagePrice,
        currentPrice: v.currentPrice,
      });
      this.message.set(
        'Position saved. Choose “Use current position” in a calculator to reuse it.',
      );
    }
  }
}
