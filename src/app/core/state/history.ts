import { Injectable, inject, signal } from '@angular/core';
import { CalculationSnapshot } from '../models/calculation';
import { StorageService } from '../storage/storage';
import { PreferencesStore } from './preferences';
import { savedRecord, validSavedList } from '../storage/snapshot-validation';
import { getCalculator } from '../config/calculators';
@Injectable({ providedIn: 'root' })
export class HistoryStore {
  private readonly storage = inject(StorageService);
  private readonly preferences = inject(PreferencesStore);
  readonly items = signal(this.storage.read('history', [], validSavedList));
  record(snapshot: CalculationSnapshot): void {
    if (!this.preferences.historyEnabled()) return;
    const first = this.items()[0];
    if (
      first &&
      first.calculatorId === snapshot.calculatorId &&
      first.mode === snapshot.mode &&
      JSON.stringify(first.inputs) === JSON.stringify(snapshot.inputs) &&
      JSON.stringify(first.lots) === JSON.stringify(snapshot.lots)
    )
      return;
    this.items.update((items) =>
      [
        savedRecord({
          ...snapshot,
          label: getCalculator(snapshot.calculatorId)?.title ?? 'Calculation',
        }),
        ...items,
      ].slice(0, 100),
    );
    this.storage.write('history', this.items());
  }
  clear(): void {
    this.items.set([]);
    this.storage.write('history', []);
  }
}
