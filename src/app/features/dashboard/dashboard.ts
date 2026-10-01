import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { CALCULATORS, getCalculator } from '../../core/config/calculators';
import { RecentStore } from '../../core/state/recent';
import { CalculatorCard } from '../../shared/components/calculator-card';
import { Icon } from '../../shared/components/icon';
import { QuickPosition } from './quick-position';
@Component({
  selector: 'eq-dashboard',
  imports: [RouterLink, CalculatorCard, Icon, DatePipe, QuickPosition],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  readonly recent = inject(RecentStore);
  readonly featured = CALCULATORS.filter((c) => c.featured);
  readonly getCalculator = getCalculator;
}
