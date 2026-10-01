import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CalculationMetric } from '../../core/models/calculation';
import { MetricPipe } from '../../core/utilities/format';
import { Icon } from './icon';
@Component({
  selector: 'eq-result-panel',
  imports: [MetricPipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <section
    class="result-panel"
    aria-label="Calculation result"
    aria-live="polite"
    aria-atomic="true"
  >
    <div class="section-eyebrow">
      <span>YOUR RESULT</span
      ><span class="live-tag"><span></span> Live calculation</span>
    </div>
    @if (metrics().length) {
      @let primary = metrics()[0];
      <div class="primary-result">
        <span>{{ primary.label }}</span
        ><strong
          [class.negative]="primary.sentiment === 'negative'"
          [class.positive]="primary.sentiment === 'positive'"
          [class.text-result]="primary.format === 'text'"
          >{{ primary.value | metric: primary.format }}</strong
        >
      </div>
      <div class="result-metrics">
        @for (m of metrics().slice(1, secondaryLimit() + 1); track m.label) {
          <div>
            <span>{{ m.label }}</span
            ><strong
              [class.negative]="m.sentiment === 'negative'"
              [class.positive]="m.sentiment === 'positive'"
              >{{ m.value | metric: m.format }}</strong
            >
          </div>
        }
      </div>
      @if (metrics().length > secondaryLimit() + 1) {
        <details class="result-breakdown">
          <summary>View detailed breakdown</summary>
          <div class="result-metrics">
            @for (m of metrics().slice(secondaryLimit() + 1); track m.label) {
              <div>
                <span>{{ m.label }}</span
                ><strong
                  [class.negative]="m.sentiment === 'negative'"
                  [class.positive]="m.sentiment === 'positive'"
                  >{{ m.value | metric: m.format }}</strong
                >
              </div>
            }
          </div>
        </details>
      }
    } @else {
      <div class="result-empty">
        <div class="icon-tile"><eq-icon name="calculator" /></div>
        <h3>A little input. A lot of clarity.</h3>
        <p>
          {{
            error() || 'Enter your numbers to see the calculation take shape.'
          }}
        </p>
      </div>
    }
    <div class="result-footnote">
      <eq-icon name="info" /><span>{{
        note() || 'Based on your inputs. Prices are entered manually.'
      }}</span>
    </div>
  </section>`,
})
export class ResultPanel {
  readonly metrics = input<readonly CalculationMetric[]>([]);
  readonly error = input('');
  readonly note = input('');
  readonly secondaryLimit = input(100);
}
