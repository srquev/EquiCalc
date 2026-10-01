import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { By } from '@angular/platform-browser';
import { SipPage } from './sip-page';
import { SavedStore } from '../../../core/state/saved';
import { HistoryStore } from '../../../core/state/history';
import { FavouritesStore } from '../../../core/state/favourites';
import { RecentStore } from '../../../core/state/recent';
import { ResultActions } from '../../../shared/components/result-actions';
import { snapshotInputs, snapshotMode } from '../snapshot-summary';

const params = new BehaviorSubject(convertToParamMap({}));
describe('SIP workspace', () => {
  let fixture: ComponentFixture<SipPage>;
  let page: SipPage;
  beforeEach(async () => {
    localStorage.clear();
    params.next(convertToParamMap({}));
    await TestBed.configureTestingModule({
      imports: [SipPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: params.asObservable() },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(SipPage);
    page = fixture.componentInstance;
    fixture.detectChanges();
  });
  afterEach(() => localStorage.clear());
  const basic = () => {
    page.form.patchValue({
      monthlyContribution: 10000,
      years: 1,
      annualReturnRate: 0,
    });
    fixture.detectChanges();
  };
  it('starts with only three empty primary fields and collapsed advanced options', () => {
    expect(page.mode()).toBe('projection-fixed');
    expect(page.outcome().calculation).toBeNull();
    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('details.advanced-options')
        ?.hasAttribute('open'),
    ).toBeFalse();
    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll(
        '.sip-main-fields input',
      ).length,
    ).toBe(3);
    expect(page.outcome().error).toBe('');
  });
  it('accepts blank optional fields and a 0% return without validation errors', () => {
    basic();
    expect(page.outcome().calculation?.projection.finalValue).toBe(120000);
    expect(page.outcome().error).toBe('');
    page.changeStyle(true);
    expect(page.outcome().calculation?.projection.finalValue).toBe(120000);
    expect(
      page
        .outcome()
        .calculation?.metrics.some((m) => m.label === 'Annual SIP step-up'),
    ).toBeFalse();
  });
  it('only applies increases in Step-Up mode and updates results reactively', () => {
    basic();
    page.form.patchValue({ years: 2, stepUpRate: 10 });
    expect(page.outcome().calculation?.projection.finalValue).toBe(240000);
    page.changeStyle(true);
    expect(page.outcome().calculation?.projection.finalValue).toBe(252000);
    expect(page.advancedOpen()).toBeTrue();
    page.changeStyle(false);
    expect(page.outcome().calculation?.projection.finalValue).toBe(240000);
  });
  it('loads the requested example and resets optional settings', () => {
    page.example();
    fixture.detectChanges();
    expect(page.values()['monthlyContribution']).toBe(10000);
    expect(page.values()['years']).toBe(15);
    expect(page.values()['stepUpRate']).toBe(10);
    expect(page.outcome().calculation?.projection.yearlyBreakdown.length).toBe(
      15,
    );
    page.toggle('inflationEnabled', true);
    page.toggle('delayEnabled', true);
    page.reset();
    expect(page.outcome().calculation).toBeNull();
    expect(page.values()['initialLumpSum']).toBeNull();
    expect(page.values()['inflationEnabled']).toBe(0);
    expect(page.values()['delayEnabled']).toBe(0);
    expect(page.advancedOpen()).toBeFalse();
  });
  it('ignores disabled optional fields and validates them only when enabled', () => {
    basic();
    page.form.patchValue({ inflationRate: -1, delayMonths: 100 });
    expect(page.outcome().error).toBe('');
    expect(page.outcome().calculation?.realValue).toBeNull();
    page.toggle('inflationEnabled', true);
    expect(page.outcome().error).toContain('inflation');
    page.toggle('inflationEnabled', false);
    page.toggle('delayEnabled', true);
    expect(page.outcome().error).toContain('delay');
    page.control('delayMonths').setValue(null);
    expect(page.outcome().error).toBe('');
    page.control('inflationRate').setValue(null);
    page.toggle('inflationEnabled', true);
    expect(page.outcome().calculation?.realValue).toBe(120000);
  });
  it('supports a goal, cap, additional months and an optional current-plan gap', () => {
    page.changePurpose(true);
    page.form.patchValue({
      targetCorpus: 150000,
      years: 1,
      additionalMonths: 3,
      annualReturnRate: 0,
      plannedMonthlyContribution: 8000,
    });
    expect(
      page.outcome().calculation?.goal?.requiredStartingMonthlyContribution,
    ).toBeCloseTo(10000, 3);
    expect(page.outcome().calculation?.planned?.finalValue).toBe(120000);
    page.control('maximumMonthlyContribution').setValue(5000);
    expect(page.outcome().error).toContain('cannot be reached');
  });
  it('saves and restores all modes and advanced settings through the existing store', () => {
    page.changePurpose(true);
    page.example();
    page.form.patchValue({
      initialLumpSum: 200000,
      maximumMonthlyContribution: 100000,
      stepUpIntervalMonths: 6,
      contributionTiming: 1,
      inflationEnabled: 1,
      inflationRate: 6,
      delayEnabled: 1,
      delayMonths: 6,
      plannedMonthlyContribution: 10000,
    });
    fixture.detectChanges();
    const original = page.outcome().calculation!.projection.finalValue;
    const actions = fixture.debugElement.query(By.directive(ResultActions))
      .componentInstance as ResultActions;
    actions.save('SIP goal scenario');
    const item = TestBed.inject(SavedStore).items()[0];
    expect(item.calculatorId).toBe('sip');
    expect(item.mode).toBe('goal-step');
    page.reset();
    params.next(convertToParamMap({ saved: item.id }));
    fixture.detectChanges();
    expect(page.mode()).toBe('goal-step');
    expect(page.values()['stepUpIntervalMonths']).toBe(6);
    expect(page.values()['inflationEnabled']).toBe(1);
    expect(page.values()['delayMonths']).toBe(6);
    expect(page.outcome().calculation?.projection.finalValue).toBe(original);
  });
  it('omits disabled optional values from shared text', () => {
    basic();
    page.form.patchValue({ stepUpRate: 10, inflationRate: 6, delayMonths: 6 });
    const text = snapshotInputs(page.snapshot()).join('\n');
    expect(text).toContain('Monthly SIP');
    expect(text).not.toContain('inflation');
    expect(text).not.toContain('Start investing after');
    expect(text).not.toContain('SIP increase');
    page.changeStyle(true);
    page.toggle('inflationEnabled', true);
    expect(snapshotInputs(page.snapshot()).join('\n')).toContain(
      'Assumed inflation',
    );
    expect(snapshotMode(page.snapshot())).toContain('Step-Up SIP');
  });
  it('uses debounced history and supports favourites and recent calculators', fakeAsync(() => {
    basic();
    page.control('monthlyContribution').setValue(11000);
    page.control('monthlyContribution').setValue(12000);
    expect(TestBed.inject(HistoryStore).items().length).toBe(0);
    tick(1201);
    expect(TestBed.inject(HistoryStore).items().length).toBe(1);
    expect(
      TestBed.inject(HistoryStore).items()[0].inputs['monthlyContribution'],
    ).toBe(12000);
    page.favourites.toggle('sip');
    expect(TestBed.inject(FavouritesStore).ids()).toContain('sip');
    expect(TestBed.inject(RecentStore).items()[0].id).toBe('sip');
  }));
  it('shows an explicit zero-SIP result when the lump sum meets the target', () => {
    page.changePurpose(true);
    page.form.patchValue({
      targetCorpus: 100000,
      years: 1,
      annualReturnRate: 0,
      initialLumpSum: 100000,
    });
    fixture.detectChanges();
    expect(
      page.outcome().calculation?.goal?.requiredStartingMonthlyContribution,
    ).toBe(0);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No monthly SIP is needed',
    );
  });
});
