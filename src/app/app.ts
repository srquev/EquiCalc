import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AppShell } from './layout/app-shell';
@Component({
  selector: 'app-root',
  imports: [AppShell],
  template: '<eq-app-shell />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
