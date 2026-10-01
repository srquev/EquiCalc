import { positive, finiteResult, CalculationError } from './validation';
export function calculateRiskReward(entry: number, stop: number, target: number) {
  positive(entry, 'Entry'); positive(stop, 'Stop', true); positive(target, 'Target');
  if (stop >= entry || target <= entry) throw new CalculationError('For a long position, stop must be below entry and target above entry.');
  const risk = entry - stop, reward = target - entry;
  return finiteResult({ risk, reward, downside: risk / entry * 100, upside: reward / entry * 100,
    riskReward: risk / reward, rewardRisk: reward / risk });
}
