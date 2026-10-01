import { positive, rate, finiteResult, CalculationError } from './validation';
export function calculatePositionSize(capital: number, risk: number, entry: number, stop: number) {
  positive(capital, 'Portfolio capital'); rate(risk, 'Maximum risk', 0.01, 100); positive(entry, 'Entry price'); positive(stop, 'Stop price', true);
  if (stop >= entry) throw new CalculationError('Stop-loss price must be below entry for a long position.');
  const maximumRisk = capital * risk / 100, riskPerShare = entry - stop;
  const riskLimitedShares = Math.floor(maximumRisk / riskPerShare);
  const maximumShares = Math.min(riskLimitedShares, Math.floor(capital / entry));
  const positionValue = maximumShares * entry;
  return finiteResult({ maximumRisk, riskPerShare, maximumShares, positionValue,
    allocation: positionValue / capital * 100, actualRisk: maximumShares * riskPerShare });
}
