import { Injectable, inject, signal } from '@angular/core';
import { StorageService } from '../storage/storage';
@Injectable({ providedIn: 'root' })
export class PreferencesStore {
  private readonly storage = inject(StorageService);
  readonly compact = signal(
    this.storage.read(
      'compact',
      false,
      (v): v is boolean => typeof v === 'boolean',
    ),
  );
  readonly historyEnabled = signal(
    this.storage.read(
      'historyEnabled',
      true,
      (v): v is boolean => typeof v === 'boolean',
    ),
  );
  setCompact(value: boolean): void {
    this.compact.set(value);
    this.storage.write('compact', value);
  }
  setHistory(value: boolean): void {
    this.historyEnabled.set(value);
    this.storage.write('historyEnabled', value);
  }
}
