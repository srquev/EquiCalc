import { Injectable, signal } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class StorageService {
  readonly warning = signal('');
  read<T>(
    key: string,
    fallback: T,
    validate: (value: unknown) => value is T,
  ): T {
    try {
      const raw = localStorage.getItem(`equicalc.v1.${key}`);
      if (raw === null) return fallback;
      const parsed: unknown = JSON.parse(raw);
      return validate(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  write(key: string, value: unknown): void {
    try {
      localStorage.setItem(`equicalc.v1.${key}`, JSON.stringify(value));
      this.warning.set('');
    } catch {
      this.warning.set(
        'Browser storage is unavailable or full. Changes work for this session but may not survive a refresh.',
      );
    }
  }
  clear(): void {
    try {
      Object.keys(localStorage)
        .filter((key) => key.startsWith('equicalc.v1.'))
        .forEach((key) => localStorage.removeItem(key));
    } catch {
      this.warning.set(
        'Your browser could not clear local storage. You can clear site data in browser settings.',
      );
    }
  }
}
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
