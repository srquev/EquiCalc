import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';
import { StorageService } from '../storage/storage';
export type Theme = 'light' | 'dark' | 'system';
@Injectable({ providedIn: 'root' })
export class ThemeStore {
  private readonly storage = inject(StorageService);
  private readonly document = inject(DOCUMENT);
  private readonly media = this.document.defaultView?.matchMedia(
    '(prefers-color-scheme: dark)',
  );
  readonly preference = signal<Theme>(
    this.storage.read(
      'theme',
      'system',
      (v): v is Theme => v === 'light' || v === 'dark' || v === 'system',
    ),
  );
  private readonly systemDark = signal(this.media?.matches ?? false);
  readonly dark = computed(
    () =>
      this.preference() === 'dark' ||
      (this.preference() === 'system' && this.systemDark()),
  );
  constructor() {
    this.apply();
    this.media?.addEventListener('change', (event) => {
      this.systemDark.set(event.matches);
      this.apply();
    });
  }
  set(theme: Theme): void {
    this.preference.set(theme);
    this.storage.write('theme', theme);
    this.apply();
  }
  toggle(): void {
    this.set(this.dark() ? 'light' : 'dark');
  }
  private apply(): void {
    this.document.documentElement.dataset['theme'] = this.dark()
      ? 'dark'
      : 'light';
    this.document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', this.dark() ? '#111c1a' : '#f7f9f8');
  }
}
