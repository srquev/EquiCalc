import { Injectable, inject, signal, computed } from '@angular/core';
import { StorageService } from '../storage/storage';
import { CALCULATORS, getCalculator } from '../config/calculators';
@Injectable({ providedIn: 'root' })
export class FavouritesStore {
  private readonly storage = inject(StorageService);
  readonly ids = signal(this.storage.read<string[]>('favourites', [], (v): v is string[] => Array.isArray(v) && v.length <= 16 && v.every(id => typeof id === 'string' && !!getCalculator(id))));
  readonly calculators = computed(() => CALCULATORS.filter(c => this.ids().includes(c.id)));
  toggle(id: string): void { if (!getCalculator(id)) return; this.ids.update(ids => ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id]); this.storage.write('favourites', this.ids()); }
  clear(): void { this.ids.set([]); this.storage.write('favourites', []); }
}
