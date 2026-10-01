import { TestBed } from '@angular/core/testing';
import { StorageService } from '../storage/storage';
import { ThemeStore } from './theme';
import { SavedStore } from './saved';
import { PositionStore } from './position';
import { FavouritesStore } from './favourites';
import { RecentStore } from './recent';
import { formatCurrency } from '../utilities/format';

describe('Browser-local state', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());
  it('safely rejects malformed and incompatible local data', () => {
    localStorage.setItem('equicalc.v1.saved', '{invalid');
    localStorage.setItem('equicalc.v1.position', JSON.stringify({ quantity: -5, averagePrice: 0 }));
    localStorage.setItem('equicalc.v1.favourites', JSON.stringify(['unknown']));
    localStorage.setItem('equicalc.v1.recent', JSON.stringify([{ id: 'cagr', visitedAt: 'invalid' }]));
    expect(TestBed.inject(SavedStore).items()).toEqual([]);
    expect(TestBed.inject(PositionStore).position()).toBeNull();
    expect(TestBed.inject(FavouritesStore).ids()).toEqual([]);
    expect(TestBed.inject(RecentStore).items()).toEqual([]);
  });
  it('persists explicit theme choices and updates the document immediately', () => {
    const theme = TestBed.inject(ThemeStore); theme.set('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(JSON.parse(localStorage.getItem('equicalc.v1.theme')!)).toBe('dark');
    theme.toggle(); expect(document.documentElement.dataset['theme']).toBe('light');
  });
  it('restores a valid stored position', () => {
    localStorage.setItem('equicalc.v1.position', JSON.stringify({ quantity: 100, averagePrice: 500, currentPrice: 350 }));
    const store = TestBed.inject(PositionStore); expect(store.summary()?.netPnl).toBe(-15000);
  });
  it('keeps recent calculators unique and bounded', () => {
    const recent = TestBed.inject(RecentStore);
    for (const id of ['cagr','pe','bonus','rights','dividend','stock-split','average-down','stock-average','profit-loss']) recent.visit(id);
    expect(recent.items().length).toBe(8); recent.visit('average-down'); expect(recent.items()[0].id).toBe('average-down');
    expect(recent.items().filter(i => i.id === 'average-down').length).toBe(1);
  });
  it('continues when storage quota is exhausted', () => {
    spyOn(Storage.prototype, 'setItem').and.throwError('Quota exceeded');
    const storage = TestBed.inject(StorageService); expect(() => storage.write('test', {})).not.toThrow(); expect(storage.warning()).toContain('unavailable or full');
  });
  it('clears only EquiCalc namespaced data', () => {
    localStorage.setItem('other-app', 'keep'); localStorage.setItem('equicalc.v1.test', 'remove');
    TestBed.inject(StorageService).clear(); expect(localStorage.getItem('other-app')).toBe('keep'); expect(localStorage.getItem('equicalc.v1.test')).toBeNull();
  });
  it('formats Indian grouping, precision and compact units', () => {
    expect(formatCurrency(2500000)).toBe('₹25,00,000.00');
    expect(formatCurrency(2500000, true)).toBe('₹25L');
    expect(formatCurrency(12000000, true)).toBe('₹1.2Cr');
    expect(formatCurrency(445.541401)).toBe('₹445.54');
  });
});
