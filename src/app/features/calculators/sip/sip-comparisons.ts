import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { MetricPipe } from '../../../core/utilities/format';
import {
  calculateFixedSipComparison,
  generateReturnScenarios,
} from '../../../domain/calculations/sip-comparisons';
import { SipCalculation } from './sip-calculation';
@Component({
  selector: 'eq-sip-comparisons',
  imports: [MetricPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sip-comparisons.html',
  styleUrl: './sip-comparisons.scss',
})
export class SipComparisons {
  readonly calculation = input.required<SipCalculation>();
  readonly fixed = computed(() =>
    this.calculation().input.stepUpRate
      ? calculateFixedSipComparison(this.calculation().input)
      : null,
  );
  readonly scenarios = computed(() =>
    generateReturnScenarios(this.calculation().input),
  );
  readonly absolute = Math.abs;
  readonly goalGap = computed(() => {
    const c = this.calculation();
    return c.goal && c.planned ? c.goal.targetCorpus - c.planned.finalValue : 0;
  });
}
