import { Injectable, inject, Pipe, PipeTransform } from '@angular/core';
import { PreferencesStore } from '../state/preferences';
import { MetricFormat } from '../models/calculation';
export function formatCurrency(value: number, compact = false, currency = 'INR'): string {
  if (compact && currency === 'INR' && Math.abs(value) >= 1000) {
    const unit = Math.abs(value) >= 1e7 ? [1e7, 'Cr'] as const : Math.abs(value) >= 1e5 ? [1e5, 'L'] as const : [1000, 'K'] as const;
    return `${value < 0 ? '−' : ''}₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(Math.abs(value) / unit[0])}${unit[1]}`;
  }
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}
@Injectable({ providedIn: 'root' })
export class NumberFormatService {
  private readonly preferences = inject(PreferencesStore);
  format(value: number | string, format: MetricFormat = 'number', compact?: boolean): string {
    if (typeof value === 'string') return value;
    if (!Number.isFinite(value)) return 'Unavailable';
    if (format === 'currency') return formatCurrency(value, compact ?? this.preferences.compact());
    if (format === 'percentage') return `${value.toFixed(2)}%`;
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value);
  }
}
@Pipe({ name: 'metric', pure: false })
export class MetricPipe implements PipeTransform {
  private readonly formatter = inject(NumberFormatService);
  transform(value: number | string, format: MetricFormat = 'number', compact?: boolean): string { return this.formatter.format(value, format, compact); }
}
