import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MetricPipe } from '../../core/utilities/format';
import { calculateRecovery } from '../../domain/calculations/break-even';
import { calculateInvestmentGrowth } from '../../domain/calculations/investment-growth';
@Component({ selector: 'eq-calculator-supplement', imports: [MetricPipe], changeDetection: ChangeDetectionStrategy.OnPush,
 template: `@switch (id()) {
 @case ('break-even') { <section class="panel supplement"><h2>Why a 50% loss needs a 100% gain.</h2><p>Loss is measured from the original price. Recovery starts from a smaller base.</p><div class="table-wrap"><table><thead><tr><th scope="col">Loss from original price</th><th scope="col">Gain needed to recover</th></tr></thead><tbody>@for (r of recoveryTable; track r.loss) { <tr><td class="negative">−{{ r.loss }}%</td><td>+{{ r.recovery | metric:'percentage' }}</td></tr> }</tbody></table></div></section> }
 @case ('risk-reward') { <section class="panel supplement"><h2>Your price range</h2><div class="price-range"><div><span>Stop</span><strong>{{ value('stop') | metric:'currency' }}</strong></div><div><span>Entry</span><strong>{{ value('entry') | metric:'currency' }}</strong></div><div><span>Target</span><strong>{{ value('target') | metric:'currency' }}</strong></div></div><p class="notice">A hypothetical range for a long position. Prices and execution are not guaranteed.</p></section> }
 @case ('investment-growth') { <section class="panel supplement"><h2>Year-by-year projection</h2><p>A constant-return illustration, using your assumptions.</p><div class="table-wrap" tabindex="0" role="region" aria-label="Growth projection"><table><thead><tr><th scope="col">Year</th><th scope="col">Contributed</th><th scope="col">Estimated growth</th><th scope="col">Projected value</th></tr></thead><tbody>@for (row of projection(); track row.year) { <tr><td>{{ row.year | metric }}</td><td>{{ row.contribution | metric:'currency' }}</td><td>{{ row.growth | metric:'currency' }}</td><td>{{ row.value | metric:'currency' }}</td></tr> }</tbody></table></div></section> }
 }`,
 styles: `.price-range { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; border-top: 3px solid var(--eq-border-strong); margin-top: 24px; padding-top: 13px; }.price-range span { font-size: 10px; display: block; color: var(--eq-text-secondary); }.price-range strong { font-size: 15px; overflow-wrap: anywhere; font-variant-numeric: tabular-nums; }`
})
export class CalculatorSupplement {
 readonly id = input.required<string>(); readonly mode = input.required<string>(); readonly values = input.required<Readonly<Record<string, number | null>>>();
 readonly recoveryTable = [10,20,30,40,50,60,70,80,90].map(loss => ({ loss, recovery: calculateRecovery(100, 100 - loss) }));
 value(key: string): number { return this.values()[key] ?? 0; }
 readonly projection = computed(() => { if (this.id() !== 'investment-growth') return []; try { return calculateInvestmentGrowth(this.value('initial'), this.mode() === 'monthly' ? this.value('monthly') : 0, this.value('annual'), this.value('years')).projection; } catch { return []; } });
}
