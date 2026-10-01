import { Injectable, inject, signal } from '@angular/core';
import { StorageService, isRecord } from '../storage/storage';
import { getCalculator } from '../config/calculators';
export interface RecentCalculator {
  readonly id: string;
  readonly visitedAt: string;
}
@Injectable({ providedIn: 'root' })
export class RecentStore {
  private readonly storage = inject(StorageService);
  readonly items = signal(
    this.storage.read<RecentCalculator[]>(
      'recent',
      [],
      (v): v is RecentCalculator[] =>
        Array.isArray(v) &&
        v.length <= 8 &&
        v.every(
          (item) =>
            isRecord(item) &&
            typeof item['id'] === 'string' &&
            !!getCalculator(item['id']) &&
            typeof item['visitedAt'] === 'string' &&
            Number.isFinite(Date.parse(item['visitedAt'])),
        ),
    ),
  );
  visit(id: string): void {
    this.items.update((items) =>
      [
        { id, visitedAt: new Date().toISOString() },
        ...items.filter((item) => item.id !== id),
      ].slice(0, 8),
    );
    this.storage.write('recent', this.items());
  }
  clear(): void {
    this.items.set([]);
    this.storage.write('recent', []);
  }
}
