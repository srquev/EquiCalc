import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CALCULATORS } from '../core/config/calculators';
import { ThemeStore } from '../core/state/theme';
import { StorageService } from '../core/storage/storage';
import { Icon } from '../shared/components/icon';
@Component({
  selector: 'eq-app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Icon],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShell {
  readonly theme = inject(ThemeStore);
  readonly storage = inject(StorageService);
  readonly groups = [
    {
      title: 'CALCULATORS',
      calculators: CALCULATORS.filter(
        (c) => !['Corporate Actions', 'Valuation'].includes(c.category),
      ),
    },
    {
      title: 'CORPORATE ACTIONS',
      calculators: CALCULATORS.filter(
        (c) => c.category === 'Corporate Actions',
      ),
    },
    {
      title: 'VALUATION',
      calculators: CALCULATORS.filter((c) => c.category === 'Valuation'),
    },
  ];
}
