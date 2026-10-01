import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  CALCULATORS,
  CATEGORIES,
  CalculatorCategory,
} from '../../core/config/calculators';
import { FavouritesStore } from '../../core/state/favourites';
import { CalculatorCard } from '../../shared/components/calculator-card';
import { Icon } from '../../shared/components/icon';
@Component({
  selector: 'eq-directory',
  imports: [CalculatorCard, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<header class="page-header">
      <div class="eyebrow">THE RIGHT TOOL FOR YOUR NEXT QUESTION</div>
      <h1>A little math. A clearer picture.</h1>
      <p>
        16 focused calculators to understand your investments, explore scenarios
        and make the numbers clear.
      </p>
    </header>
    <div class="directory-search input-wrap">
      <span class="input-prefix"><eq-icon name="search" /></span
      ><input
        #search
        type="search"
        aria-label="Search calculators"
        placeholder="Search calculators, returns, recovery…"
        [value]="query()"
        (input)="query.set(search.value)"
      />
      @if (query()) {
        <button
          class="icon-button"
          aria-label="Clear search"
          (click)="query.set(''); search.focus()"
        >
          <eq-icon name="close" />
        </button>
      }
    </div>
    <div class="category-filters" aria-label="Filter by category">
      <button
        [class.active]="category() === 'All'"
        [attr.aria-pressed]="category() === 'All'"
        (click)="category.set('All')"
      >
        All calculators <span>16</span>
      </button>
      @for (c of categories; track c) {
        <button
          [class.active]="category() === c"
          [attr.aria-pressed]="category() === c"
          (click)="category.set(c)"
        >
          {{ c }}
        </button>
      }
    </div>
    @if (!query() && category() === 'All' && favourites.calculators().length) {
      <section class="favourites-section">
        <div class="section-heading">
          <h2>Your favourites</h2>
          <eq-icon name="star" />
        </div>
        <div class="calculator-grid">
          @for (c of favourites.calculators(); track c.id) {
            <eq-calculator-card [calculator]="c" />
          }
        </div>
      </section>
    }
    <div class="section-heading category-heading">
      <h2>{{ category() === 'All' ? 'All calculators' : category() }}</h2>
      <span class="category-label" role="status"
        >{{ filtered().length }} tools</span
      >
    </div>
    <div class="calculator-grid">
      @for (c of filtered(); track c.id) {
        <eq-calculator-card [calculator]="c" />
      }
    </div>
    @if (!filtered().length) {
      <div class="panel empty-state">
        <eq-icon name="search" />
        <h2>No calculators found.</h2>
        <p>Try “average”, “returns” or a different category.</p>
        <button class="btn" (click)="query.set(''); category.set('All')">
          Clear filters
        </button>
      </div>
    }`,
  styles: `
    .directory-search {
      max-width: 620px;
      margin-bottom: 20px;
    }
    .directory-search input {
      height: 48px;
      font-size: 13px;
    }
    .directory-search .input-prefix {
      display: flex;
    }
    .directory-search eq-icon {
      width: 17px;
      height: 17px;
    }
    .category-filters {
      display: flex;
      gap: 7px;
      flex-wrap: wrap;
      margin-bottom: 30px;
    }
    .category-filters button {
      min-height: 40px;
      padding: 8px 13px;
      border: 1px solid var(--eq-border);
      border-radius: 6px;
      background: var(--eq-surface);
      color: var(--eq-text-secondary);
      font-size: 11px;
    }
    .category-filters button.active {
      background: var(--eq-brand-soft);
      border-color: var(--eq-brand);
      color: var(--eq-brand);
    }
    .category-filters span {
      margin-left: 5px;
      font-size: 9px;
    }
    .favourites-section {
      padding-bottom: 10px;
    }
    .favourites-section > .section-heading eq-icon {
      color: var(--eq-brand);
    }
  `,
})
export class CalculatorDirectory {
  readonly query = signal('');
  readonly category = signal<CalculatorCategory | 'All'>('All');
  readonly categories = CATEGORIES;
  readonly favourites = inject(FavouritesStore);
  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return CALCULATORS.filter(
      (c) =>
        (this.category() === 'All' || c.category === this.category()) &&
        `${c.title} ${c.description} ${c.category} ${c.keywords.join(' ')}`
          .toLowerCase()
          .includes(q),
    );
  });
}
