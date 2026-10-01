import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { MetricPipe } from '../../../core/utilities/format';
import { SipCalculation } from './sip-calculation';
@Component({
  selector: 'eq-sip-projection-details',
  imports: [MetricPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sip-projection-details.html',
  styleUrl: './sip-projection-details.scss',
})
export class SipProjectionDetails {
  readonly calculation = input.required<SipCalculation>();
  readonly projection = computed(() => this.calculation().projection);
  readonly loss = computed(() => this.projection().totalGrowth < 0);
  readonly firstSegment = computed(() => {
    const p = this.projection();
    const denominator = this.loss() ? p.totalContributions : p.finalValue;
    return denominator
      ? Math.max(
          0,
          Math.min(
            100,
            ((this.loss() ? p.finalValue : p.totalContributions) /
              denominator) *
              100,
          ),
        )
      : 0;
  });
  readonly journey = computed(() => {
    const rows = this.projection().yearlyBreakdown;
    const last = rows.length;
    const years = new Set([
      1,
      ...(last >= 5 ? [5] : []),
      ...(last >= 10 ? [10] : []),
      last,
    ]);
    return rows.filter((row) => years.has(row.year));
  });
  readonly absolute = Math.abs;
}
