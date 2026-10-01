import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import { CalculationSnapshot } from '../../core/models/calculation';
import { SavedStore } from '../../core/state/saved';
import { HistoryStore } from '../../core/state/history';
import { getCalculator } from '../../core/config/calculators';
import { NumberFormatService } from '../../core/utilities/format';
import {
  snapshotInputs,
  snapshotMode,
} from '../../features/calculators/snapshot-summary';
import { Icon } from './icon';
@Component({
  selector: 'eq-result-actions',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="result-tools">
      <button class="btn primary" (click)="naming.set(!naming())">
        <eq-icon name="bookmark" />Save calculation</button
      ><button class="btn" (click)="copy()"><eq-icon name="copy" />Copy</button
      ><button class="btn" (click)="share()">
        <eq-icon name="share" />Share
      </button>
    </div>
    @if (naming()) {
      <form
        class="save-name"
        (submit)="$event.preventDefault(); save(label.value)"
      >
        <label for="save-label">Name this calculation</label>
        <div class="input-wrap">
          <input
            id="save-label"
            #label
            maxlength="120"
            [value]="title()"
            required
          /><button class="btn primary" type="submit">Save</button>
        </div>
      </form>
    }
    @if (message()) {
      <p class="status-message" role="status">{{ message() }}</p>
    }
    @if (manualCopy()) {
      <label for="copy-text">Select and copy your result</label
      ><textarea
        id="copy-text"
        class="copy-text"
        readonly
        [value]="manualCopy()"
      ></textarea>
    }`,
  styles: `
    .save-name {
      margin-top: 16px;
    }
    .copy-text {
      width: 100%;
      min-height: 180px;
      padding: 12px;
      color: var(--eq-text);
      background: var(--eq-surface);
      border: 1px solid var(--eq-border-strong);
      border-radius: 6px;
      font-size: 12px;
    }
  `,
})
export class ResultActions {
  readonly snapshot = input.required<CalculationSnapshot>();
  readonly naming = signal(false);
  readonly message = signal('');
  readonly manualCopy = signal('');
  private readonly saved = inject(SavedStore);
  private readonly history = inject(HistoryStore);
  private readonly format = inject(NumberFormatService);
  title(): string {
    return getCalculator(this.snapshot().calculatorId)?.title ?? 'Calculation';
  }
  save(label: string): void {
    this.saved.save(this.snapshot(), label);
    this.history.record(this.snapshot());
    this.naming.set(false);
    this.message.set('Saved in this browser. Find it in Saved calculations.');
  }
  private text(): string {
    const s = this.snapshot();
    return [
      `EquiCalc — ${this.title()}`,
      `Mode: ${snapshotMode(s)}`,
      '',
      ...snapshotInputs(s),
      '',
      ...s.metrics.map(
        (m) => `${m.label}: ${this.format.format(m.value, m.format, false)}`,
      ),
      '',
      'Mathematical illustration, not investment advice.',
    ].join('\n');
  }
  async copy(): Promise<void> {
    this.history.record(this.snapshot());
    const text = this.text();
    try {
      await navigator.clipboard.writeText(text);
      this.message.set('Result copied to clipboard.');
      this.manualCopy.set('');
    } catch {
      this.manualCopy.set(text);
      this.message.set(
        'Clipboard access is unavailable. Select and copy the text below.',
      );
    }
  }
  async share(): Promise<void> {
    this.history.record(this.snapshot());
    if (navigator.share) {
      try {
        await navigator.share({
          title: `EquiCalc — ${this.title()}`,
          text: this.text(),
        });
        this.message.set('Share sheet opened.');
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError'))
          await this.copy();
      }
    } else await this.copy();
  }
}
