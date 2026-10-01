import { Injectable, inject, signal } from '@angular/core';
import { CalculationSnapshot } from '../models/calculation';
import { StorageService } from '../storage/storage';
import { savedRecord, validSavedList } from '../storage/snapshot-validation';
@Injectable({ providedIn: 'root' })
export class SavedStore {
  private readonly storage = inject(StorageService);
  readonly items = signal(this.storage.read('saved', [], validSavedList));
  save(snapshot: CalculationSnapshot, label: string): void { this.items.update(items => [savedRecord({ ...snapshot, label: label.trim().slice(0, 120) || 'Untitled calculation' }), ...items].slice(0, 200)); this.persist(); }
  rename(id: string, label: string): void { if (!label.trim()) return; this.items.update(items => items.map(item => item.id === id ? { ...item, label: label.trim().slice(0, 120), updatedAt: new Date().toISOString() } : item)); this.persist(); }
  duplicate(id: string): void { const item = this.items().find(item => item.id === id); if (item) this.save(item, `${item.label} (copy)`); }
  delete(id: string): void { this.items.update(items => items.filter(item => item.id !== id)); this.persist(); }
  clear(): void { this.items.set([]); this.persist(); }
  private persist(): void { this.storage.write('saved', this.items()); }
}
