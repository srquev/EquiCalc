import { Injectable, computed, inject, signal } from '@angular/core';
import { InvestorPosition } from '../../domain/models/position';
import { calculatePosition } from '../../domain/calculations/position';
import { StorageService, isRecord } from '../storage/storage';
function validPosition(value: unknown): value is InvestorPosition {
  if (!isRecord(value)) return false;
  const { quantity, averagePrice, currentPrice } = value;
  if (
    typeof quantity !== 'number' ||
    typeof averagePrice !== 'number' ||
    typeof currentPrice !== 'number'
  )
    return false;
  try {
    calculatePosition({ quantity, averagePrice, currentPrice });
    return true;
  } catch {
    return false;
  }
}
@Injectable({ providedIn: 'root' })
export class PositionStore {
  private readonly storage = inject(StorageService);
  readonly position = signal<InvestorPosition | null>(
    this.storage.read(
      'position',
      null,
      (v): v is InvestorPosition | null => v === null || validPosition(v),
    ),
  );
  readonly summary = computed(() => {
    const p = this.position();
    return p ? calculatePosition(p) : null;
  });
  set(position: InvestorPosition): void {
    calculatePosition(position);
    this.position.set(position);
    this.storage.write('position', position);
  }
  clear(): void {
    this.position.set(null);
    this.storage.write('position', null);
  }
}
