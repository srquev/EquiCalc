import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FieldDefinition } from '../../features/calculators/calculator-config';
@Component({
  selector: 'eq-field',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <label [for]="id()"
      >{{ field().label }}
      @if (field().optional) {
        <span class="optional">optional</span>
      }
    </label>
    <div
      class="input-wrap"
      [class.invalid]="control().invalid && control().touched"
    >
      @if (field().options; as options) {
        <select
          [id]="id()"
          [formControl]="control()"
          [attr.aria-describedby]="id() + '-hint'"
        >
          @for (option of options; track option.value) {
            <option [ngValue]="option.value">{{ option.label }}</option>
          }
        </select>
      } @else {
        @if (field().unit === '₹') {
          <span class="input-prefix" aria-hidden="true">₹</span>
        }
        <input
          [id]="id()"
          type="number"
          inputmode="decimal"
          [formControl]="control()"
          [min]="field().min ?? 0"
          [step]="field().step ?? 'any'"
          placeholder="0"
          [attr.aria-invalid]="control().invalid && control().touched"
          [attr.aria-describedby]="id() + '-hint'"
        />
        @if (field().unit && field().unit !== '₹') {
          <span class="input-suffix">{{ field().unit }}</span>
        }
      }
    </div>
    <div [id]="id() + '-hint'">
      @if (control().invalid && control().touched) {
        <small class="field-error"
          >Enter a valid {{ field().step === 1 ? 'whole' : '' }} number{{
            field().min !== undefined ? ' within the allowed range' : ''
          }}.</small
        >
      } @else if (field().hint) {
        <small class="field-hint">{{ field().hint }}</small>
      }
    </div>`,
})
export class FinancialField {
  readonly field = input.required<FieldDefinition>();
  readonly control = input.required<FormControl<number | null>>();
  readonly id = input.required<string>();
}
