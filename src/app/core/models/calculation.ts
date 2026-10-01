import { PurchaseLot } from '../../domain/models/position';
export type MetricFormat = 'currency' | 'percentage' | 'number' | 'text';
export interface CalculationMetric {
  readonly label: string;
  readonly value: number | string;
  readonly format: MetricFormat;
  readonly sentiment?: 'positive' | 'negative' | 'neutral';
}
export interface CalculationSnapshot {
  readonly calculatorId: string;
  readonly mode: string;
  readonly inputs: Readonly<Record<string, number | null>>;
  readonly lots: readonly PurchaseLot[];
  readonly metrics: readonly CalculationMetric[];
}
export interface SavedCalculation extends CalculationSnapshot {
  readonly id: string;
  readonly label: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
