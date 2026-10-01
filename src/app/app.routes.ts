import { Routes } from '@angular/router';
import { CALCULATORS } from './core/config/calculators';
export const routes: Routes = [
  {
    path: '',
    title: 'EquiCalc — Your investor calculation workspace',
    loadComponent: () =>
      import('./features/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'calculators',
    title: 'Calculator directory · EquiCalc',
    loadComponent: () =>
      import('./features/calculators/directory').then(
        (m) => m.CalculatorDirectory,
      ),
  },
  ...CALCULATORS.map((calculator) => ({
    path: `calculators/${calculator.id}`,
    title: `${calculator.title} calculator · EquiCalc`,
    data: { calculatorId: calculator.id },
    loadComponent:
      calculator.id === 'sip'
        ? () =>
            import('./features/calculators/sip/sip-page').then((m) => m.SipPage)
        : () =>
            import('./features/calculators/calculator-page').then(
              (m) => m.CalculatorPage,
            ),
  })),
  {
    path: 'saved',
    title: 'Saved calculations · EquiCalc',
    data: { history: false },
    loadComponent: () =>
      import('./features/saved/collection').then(
        (m) => m.CalculationCollection,
      ),
  },
  {
    path: 'history',
    title: 'Calculation history · EquiCalc',
    data: { history: true },
    loadComponent: () =>
      import('./features/saved/collection').then(
        (m) => m.CalculationCollection,
      ),
  },
  {
    path: 'settings',
    title: 'Settings · EquiCalc',
    loadComponent: () =>
      import('./features/settings/settings').then((m) => m.Settings),
  },
  {
    path: 'about',
    title: 'About · EquiCalc',
    data: { page: 'about' },
    loadComponent: () =>
      import('./features/information/information').then((m) => m.Information),
  },
  {
    path: 'disclaimer',
    title: 'Disclaimer · EquiCalc',
    data: { page: 'disclaimer' },
    loadComponent: () =>
      import('./features/information/information').then((m) => m.Information),
  },
  {
    path: '**',
    title: 'Page not found · EquiCalc',
    data: { page: '404' },
    loadComponent: () =>
      import('./features/information/information').then((m) => m.Information),
  },
];
