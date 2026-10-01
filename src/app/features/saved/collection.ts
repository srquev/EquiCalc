import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { SavedStore } from '../../core/state/saved';
import { HistoryStore } from '../../core/state/history';
import { PreferencesStore } from '../../core/state/preferences';
import { getCalculator } from '../../core/config/calculators';
import { SavedCalculation } from '../../core/models/calculation';
import { snapshotInputs, snapshotMode } from '../calculators/snapshot-summary';
import { Icon } from '../../shared/components/icon';
import { MetricPipe } from '../../core/utilities/format';
@Component({
  selector: 'eq-collection',
  imports: [RouterLink, DatePipe, Icon, MetricPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<header class="page-header">
      <div class="eyebrow">YOUR WORKSPACE, REMEMBERED</div>
      <div class="section-heading">
        <h1>
          {{ isHistory ? 'Calculation history' : 'Your saved calculations' }}
        </h1>
        @if (isHistory && items().length) {
          <button class="btn danger" (click)="clearHistory()">
            Clear history
          </button>
        }
      </div>
      <p>
        {{
          isHistory
            ? 'Revisit the calculations you’ve explored. Stable, complete results are recorded here.'
            : 'Keep the scenarios that matter. Your saved calculations stay in this browser.'
        }}
      </p>
    </header>
    @if (isHistory && !preferences.historyEnabled()) {
      <p class="notice">
        History tracking is paused. You can enable it in
        <a routerLink="/settings">Settings</a>.
      </p>
    }
    @if (!items().length) {
      <section class="panel empty-state">
        <span class="icon-tile"
          ><eq-icon [name]="isHistory ? 'history' : 'bookmark'"
        /></span>
        <h2>
          {{
            isHistory
              ? 'Your calculation history is empty.'
              : 'A little clarity, worth keeping.'
          }}
        </h2>
        <p>
          {{
            isHistory
              ? 'Complete a calculation and it will appear here when history is enabled.'
              : 'Save your first calculation to compare scenarios and pick up where you left off.'
          }}
        </p>
        <a class="btn primary" routerLink="/calculators"
          >Explore calculators <eq-icon name="arrow"
        /></a>
      </section>
    }
    @for (group of groups(); track group.label) {
      @if (isHistory) {
        <h2 class="group-heading">{{ group.label }}</h2>
      }
      <div class="collection-grid">
        @for (item of group.items; track item.id) {
          <article class="panel saved-card">
            <div class="saved-top">
              <span class="icon-tile"
                ><eq-icon
                  [name]="
                    calculator(item.calculatorId)?.icon ?? 'calculator'
                  " /></span
              ><span class="category-label">{{
                item.updatedAt | date: 'MMM d, y · h:mm a'
              }}</span>
            </div>
            @if (renaming() === item.id) {
              <form
                (submit)="$event.preventDefault(); rename(item.id, name.value)"
              >
                <label [for]="'name-' + item.id">Calculation name</label>
                <div class="input-wrap">
                  <input
                    [id]="'name-' + item.id"
                    #name
                    [value]="item.label"
                    maxlength="120"
                    required
                  /><button class="btn primary" type="submit">Save</button>
                </div>
                <button
                  class="btn subtle"
                  type="button"
                  (click)="renaming.set('')"
                >
                  Cancel
                </button>
              </form>
            } @else {
              <h2>{{ item.label }}</h2>
              <p>
                {{ calculator(item.calculatorId)?.title }} ·
                {{ modeLabel(item) }}
              </p>
            }
            <div class="saved-result">
              <span>{{ item.metrics[0].label }}</span
              ><strong>{{
                item.metrics[0].value | metric: item.metrics[0].format
              }}</strong>
            </div>
            <p class="saved-inputs">{{ inputSummary(item) }}</p>
            <div class="saved-actions">
              <a
                class="btn primary"
                [routerLink]="calculator(item.calculatorId)?.route"
                [queryParams]="
                  isHistory ? { history: item.id } : { saved: item.id }
                "
                >Open <eq-icon name="arrow"
              /></a>
              @if (!isHistory) {
                <button class="btn subtle" (click)="renaming.set(item.id)">
                  Rename</button
                ><button class="btn subtle" (click)="saved.duplicate(item.id)">
                  Duplicate</button
                ><button class="btn subtle danger" (click)="remove(item)">
                  Delete
                </button>
              } @else {
                <button class="btn subtle" (click)="saveHistory(item)">
                  <eq-icon name="bookmark" />Save
                </button>
              }
            </div>
          </article>
        }
      </div>
    }
    @if (message()) {
      <p class="status-message" role="status">{{ message() }}</p>
    }`,
  styles: `
    .collection-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 20px;
    }
    .saved-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }
    .saved-card h2 {
      font-size: 17px;
      overflow-wrap: anywhere;
    }
    .saved-card > p {
      font-size: 11px;
    }
    .saved-result {
      padding: 17px 0;
      border-top: 1px solid var(--eq-border);
    }
    .saved-result span {
      display: block;
      color: var(--eq-text-muted);
      font-size: 10px;
    }
    .saved-result strong {
      display: block;
      font-size: 26px;
      letter-spacing: -0.7px;
      margin-top: 5px;
      font-variant-numeric: tabular-nums;
      overflow-wrap: anywhere;
    }
    .saved-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      border-top: 1px solid var(--eq-border);
      padding-top: 17px;
    }
    .saved-actions .btn {
      padding: 9px 12px;
    }
    .saved-inputs {
      line-height: 1.8;
      overflow-wrap: anywhere;
    }
    .group-heading {
      font-size: 12px;
      color: var(--eq-text-muted);
      margin: 28px 0 14px;
    }
    @media (max-width: 1000px) {
      .collection-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class CalculationCollection {
  readonly isHistory = !!inject(ActivatedRoute).snapshot.data['history'];
  readonly saved = inject(SavedStore);
  readonly history = inject(HistoryStore);
  readonly preferences = inject(PreferencesStore);
  readonly items = computed(() =>
    this.isHistory ? this.history.items() : this.saved.items(),
  );
  readonly calculator = getCalculator;
  readonly renaming = signal('');
  readonly message = signal('');
  readonly groups = computed(() => {
    const groups = new Map<string, SavedCalculation[]>();
    for (const item of this.items()) {
      const date = new Date(item.createdAt);
      const label = this.isHistory
        ? date.toDateString() === new Date().toDateString()
          ? 'Today'
          : date.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
        : 'Saved';
      groups.set(label, [...(groups.get(label) ?? []), item]);
    }
    return [...groups].map(([label, items]) => ({ label, items }));
  });
  modeLabel(item: SavedCalculation): string {
    return snapshotMode(item);
  }
  inputSummary(item: SavedCalculation): string {
    return snapshotInputs(item).join(' · ');
  }
  rename(id: string, name: string): void {
    this.saved.rename(id, name);
    this.renaming.set('');
  }
  remove(item: SavedCalculation): void {
    if (confirm(`Delete “${item.label}”? This cannot be undone.`))
      this.saved.delete(item.id);
  }
  clearHistory(): void {
    if (confirm('Clear all calculation history? This cannot be undone.'))
      this.history.clear();
  }
  saveHistory(item: SavedCalculation): void {
    this.saved.save(item, item.label);
    this.message.set('Calculation saved. Find it in Saved calculations.');
  }
}
