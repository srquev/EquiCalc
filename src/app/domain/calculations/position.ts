import { InvestorPosition } from '../models/position';
import { calculateProfitLoss } from './profit-loss';
import { calculateBreakEven } from './break-even';
export function calculatePosition(position: InvestorPosition) {
  const { quantity, averagePrice, currentPrice } = position;
  return {
    ...calculateProfitLoss(averagePrice, currentPrice, quantity),
    ...calculateBreakEven(averagePrice, currentPrice, quantity),
  };
}
