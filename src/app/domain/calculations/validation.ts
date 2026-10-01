export class CalculationError extends Error {}
export function positive(value: number, label: string, allowZero = false): number {
  if (!Number.isFinite(value) || value > 1e15 || (allowZero ? value < 0 : value <= 0)) {
    throw new CalculationError(`${label} must be ${allowZero ? 'zero or ' : ''}greater than zero and no more than 1,000 trillion.`);
  }
  return value;
}
export function whole(value: number, label: string, allowZero = false): number {
  positive(value, label, allowZero);
  if (!Number.isSafeInteger(value)) throw new CalculationError(`${label} must be a whole number.`);
  return value;
}
export function rate(value: number, label: string, min = -100, max = 10000): number {
  if (!Number.isFinite(value) || value < min || value > max) throw new CalculationError(`${label} must be between ${min} and ${max}.`);
  return value;
}
export function finiteResult<T>(result: T): T {
  function inspect(value: unknown): void {
    if (typeof value === 'number' && (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER)) {
      throw new CalculationError('These values produce a result outside the supported precision. Please use smaller values.');
    }
    if (typeof value === 'object' && value !== null) Object.values(value).forEach(inspect);
  }
  inspect(result);
  return result;
}
