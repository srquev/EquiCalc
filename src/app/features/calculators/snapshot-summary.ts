import { CalculationSnapshot } from '../../core/models/calculation';
import { formatCurrency } from '../../core/utilities/format';
import { CONFIGS } from './calculator-config';
export function snapshotMode(snapshot: CalculationSnapshot): string {
  return (
    CONFIGS[snapshot.calculatorId]?.modes.find(
      (mode) => mode.id === snapshot.mode,
    )?.label ?? 'Calculation'
  );
}
export function snapshotInputs(
  snapshot: CalculationSnapshot,
): readonly string[] {
  if (snapshot.lots.length)
    return snapshot.lots.map(
      (lot, index) =>
        `Purchase ${index + 1}: ${lot.quantity.toLocaleString('en-IN')} shares at ${formatCurrency(lot.price)}`,
    );
  const mode = CONFIGS[snapshot.calculatorId]?.modes.find(
    (mode) => mode.id === snapshot.mode,
  );
  return (mode?.fields ?? []).flatMap((field) => {
    const value = snapshot.inputs[field.key];
    if (value === null || value === undefined) return [];
    const option = field.options?.find((option) => option.value === value);
    const formatted =
      option?.label ??
      (field.unit === '₹'
        ? formatCurrency(value)
        : `${value.toLocaleString('en-IN')}${field.unit ? ` ${field.unit}` : ''}`);
    return [`${field.label}: ${formatted}`];
  });
}
