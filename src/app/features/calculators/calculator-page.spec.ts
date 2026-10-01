import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CalculatorPage } from './calculator-page';
import { PositionStore } from '../../core/state/position';
import { SavedStore } from '../../core/state/saved';
import { FavouritesStore } from '../../core/state/favourites';
import { HistoryStore } from '../../core/state/history';
import { PreferencesStore } from '../../core/state/preferences';
import { ResultActions } from '../../shared/components/result-actions';
import { By } from '@angular/platform-browser';

async function setup(id: string): Promise<ComponentFixture<CalculatorPage>> {
  await TestBed.configureTestingModule({ imports: [CalculatorPage], providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { data: { calculatorId: id } }, queryParamMap: of(convertToParamMap({})) } }] }).compileComponents();
  const fixture = TestBed.createComponent(CalculatorPage); fixture.detectChanges(); return fixture;
}
describe('Calculator workflows', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());
  it('starts empty, loads examples and resets all results', async () => {
    const fixture = await setup('average-down'); const page = fixture.componentInstance;
    expect(page.outcome().metrics.length).toBe(0);
    page.example(); fixture.detectChanges();
    expect(page.outcome().metrics[0].value).toBeCloseTo(445.541401, 5);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('₹445.54');
    page.reset(); fixture.detectChanges();
    expect(page.outcome().metrics.length).toBe(0); expect(page.control('quantity').value).toBeNull();
  });
  it('switches average-down mode and surfaces impossible targets', async () => {
    const fixture = await setup('average-down'); const page = fixture.componentInstance;
    page.example(); page.switchMode('target'); page.control('target').setValue(400); fixture.detectChanges();
    expect(page.outcome().metrics[0].value).toBe(400);
    page.control('target').setValue(300); fixture.detectChanges();
    expect(page.outcome().metrics.length).toBe(0); expect(page.outcome().error).toContain('cannot be achieved');
    page.switchMode('investment'); expect(page.form.contains('target')).toBeFalse();
  });
  it('applies a shared position only after explicit use', async () => {
    const fixture = await setup('average-down'); const page = fixture.componentInstance;
    TestBed.inject(PositionStore).set({ quantity: 75, averagePrice: 800, currentPrice: 700 });
    fixture.detectChanges(); expect(page.control('quantity').value).toBeNull();
    page.usePosition(); fixture.detectChanges();
    expect(page.control('quantity').value).toBe(75); expect(page.control('average').value).toBe(800);
  });
  it('adds and removes purchases and always retains at least one row', async () => {
    const fixture = await setup('stock-average'); const page = fixture.componentInstance;
    expect(page.lots.length).toBe(1); page.removeLot(0); expect(page.lots.length).toBe(1);
    page.addLot(); expect(page.lots.length).toBe(2);
    page.example(); fixture.detectChanges(); expect(page.outcome().metrics[0].value).toBe(450);
    page.removeLot(1); fixture.detectChanges(); expect(page.outcome().metrics[0].value).toBe(500);
    for (let i = 0; i < 60; i++) page.addLot(); expect(page.lots.length).toBe(50);
    page.reset(); expect(page.lots.length).toBe(1);
  });
  it('saves structured inputs and supports rename, duplicate and delete', async () => {
    const fixture = await setup('cagr'); fixture.componentInstance.example(); fixture.detectChanges();
    const actions = fixture.debugElement.query(By.directive(ResultActions)).componentInstance as ResultActions;
    actions.save('Five-year scenario'); const saved = TestBed.inject(SavedStore);
    expect(saved.items().length).toBe(1); expect(saved.items()[0].inputs['years']).toBe(5);
    const id = saved.items()[0].id; saved.rename(id, 'Growth scenario'); expect(saved.items()[0].label).toBe('Growth scenario');
    saved.duplicate(id); expect(saved.items().length).toBe(2); expect(saved.items()[0].id).not.toBe(id);
    saved.delete(id); expect(saved.items().length).toBe(1);
    expect(JSON.parse(localStorage.getItem('equicalc.v1.saved')!).length).toBe(1);
  });
  it('toggles favourites and deduplicates history while respecting opt-out', async () => {
    const fixture = await setup('cagr'); const page = fixture.componentInstance; page.example();
    const favourites = TestBed.inject(FavouritesStore); favourites.toggle('cagr'); expect(favourites.ids()).toContain('cagr'); favourites.toggle('cagr'); expect(favourites.ids()).not.toContain('cagr');
    const history = TestBed.inject(HistoryStore); page.calculate(); page.calculate(); expect(history.items().length).toBe(1);
    TestBed.inject(PreferencesStore).setHistory(false); page.control('years').setValue(10); page.calculate(); expect(history.items().length).toBe(1);
  });
});
