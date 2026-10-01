import { CalculationMetric, MetricFormat } from '../../core/models/calculation';
import { PurchaseLot, InvestorPosition } from '../../domain/models/position';
import { calculateAverageDown, calculateTargetAverage } from '../../domain/calculations/average-down';
import { calculateWeightedAverage } from '../../domain/calculations/average-price';
import { calculateBreakEven } from '../../domain/calculations/break-even';
import { calculateProfitLoss } from '../../domain/calculations/profit-loss';
import { calculateTargetReturn } from '../../domain/calculations/target-return';
import { calculateCagr } from '../../domain/calculations/cagr';
import { calculateDividend } from '../../domain/calculations/dividend';
import { calculatePositionSize } from '../../domain/calculations/position-size';
import { calculateRiskReward } from '../../domain/calculations/risk-reward';
import { calculatePartialSell } from '../../domain/calculations/partial-sell';
import { calculateBonus } from '../../domain/calculations/bonus';
import { calculateStockSplit } from '../../domain/calculations/stock-split';
import { calculateRightsIssue } from '../../domain/calculations/rights';
import { calculatePe, calculateEps, calculateImpliedPrice } from '../../domain/calculations/pe';
import { calculateMarketCap } from '../../domain/calculations/market-cap';
import { calculateInvestmentGrowth } from '../../domain/calculations/investment-growth';
export const metric = (label: string, value: number | string, format: MetricFormat = 'currency', signed = false): CalculationMetric => ({ label, value, format, sentiment: signed && typeof value === 'number' ? (value < 0 ? 'negative' : value > 0 ? 'positive' : 'neutral') : 'neutral' });
export const recoveryMetric = (label: string, value: number | null): CalculationMetric => metric(label, value === null ? 'Undefined at zero price' : value === 0 ? 'Break-even reached' : value, value === null || value === 0 ? 'text' : 'percentage');
export const toPosition = (v: Readonly<Record<string, number | null>>): InvestorPosition => ({ quantity: v['quantity'] ?? 0, averagePrice: v['average'] ?? 0, currentPrice: v['current'] ?? 0 });
export function calculateMetrics(id: string, mode: string, inputs: Readonly<Record<string, number | null>>, lots: readonly PurchaseLot[]): readonly CalculationMetric[] {
  const n = (key: string) => inputs[key] ?? 0;
  switch (id) {
    case 'average-down': {
      const r = mode === 'target' ? calculateTargetAverage(toPosition(inputs), n('target')) : calculateAverageDown(toPosition(inputs), n('budget'));
      return [metric('New average price', r.newAverage), metric('Total shares', r.totalQuantity, 'number'), metric('Total investment', r.totalInvestment), recoveryMetric('Recovery required', r.newRecoveryPercentage), metric('Additional shares', r.additionalShares, 'number'), metric('Actual additional investment', r.additionalInvestmentUsed), metric('Unused budget', r.unusedCapital), metric('Average reduction', r.averageReduction), metric('Average reduction %', r.averageReductionPercentage, 'percentage'), metric('Current investment', r.currentInvestment), metric('Current market value', r.currentValue), metric('Current P&L', r.currentPnl, 'currency', true), metric('Current return', r.currentPnlPercentage, 'percentage', true), recoveryMetric('Previous recovery', r.oldRecoveryPercentage), ...(mode === 'target' ? [metric('Requested average', n('target')), metric('Difference from target', r.newAverage - n('target'))] : [])];
    }
    case 'stock-average': { const r = calculateWeightedAverage(lots); return [metric('Weighted average', r.average), metric('Total shares', r.quantity, 'number'), metric('Total investment', r.investment), ...r.contributions.map((v, i) => metric(`Purchase ${i + 1} contribution`, v, 'percentage'))]; }
    case 'break-even': { const r = calculateBreakEven(n('average'), n('current'), inputs['quantity'] ?? undefined); return [metric('Break-even price', r.breakEven), recoveryMetric('Recovery required', r.recovery), metric('Price difference', r.priceDifference, 'currency', true), metric('Current return', r.returnPercentage, 'percentage', true), ...(r.pnl === null ? [] : [metric('Unrealised P&L', r.pnl, 'currency', true)])]; }
    case 'profit-loss': { const r = calculateProfitLoss(n('average'), n('current'), n('quantity'), n('charges')); return [metric('Net profit / loss', r.netPnl, 'currency', true), metric('Return', r.returnPercentage, 'percentage', true), metric('Investment', r.investment), metric('Current / exit value', r.value), metric('Gross P&L', r.grossPnl, 'currency', true), metric('Charges', r.charges)]; }
    case 'target-return': { const r = calculateTargetReturn(n('average'), n('quantity'), n('desired'), mode === 'price' ? 'price' : 'return'); return [metric('Target price', r.targetPrice), metric('Return', r.returnPercentage, 'percentage', true), metric('Initial investment', r.investment), metric('Target value', r.targetValue), metric('Hypothetical profit', r.profit, 'currency', true)]; }
    case 'cagr': { const r = calculateCagr(n('initial'), n('final'), n('years')); return [metric('Compound annual growth', r.cagr, 'percentage', true), metric('Absolute return', r.absoluteReturn, 'percentage', true), metric('Profit / loss', r.profit, 'currency', true), metric('Wealth multiple', r.multiple, 'number')]; }
    case 'dividend': { const r = calculateDividend(n('quantity'), n('average'), n('current'), n('dividend'), n('frequency')); return [metric('Annual dividend income', r.annualIncome), metric('Yield on cost', r.yieldOnCost, 'percentage'), metric('Current dividend yield', r.currentYield, 'percentage'), metric('Cost basis', r.costBasis), metric('Current value', r.currentValue)]; }
    case 'position-size': { const r = calculatePositionSize(n('capital'), n('risk'), n('entry'), n('stop')); return [metric('Maximum whole shares', r.maximumShares, 'number'), metric('Maximum rupee risk', r.maximumRisk), metric('Risk per share', r.riskPerShare), metric('Position value', r.positionValue), metric('Portfolio allocation', r.allocation, 'percentage'), metric('Actual risk at stop', r.actualRisk)]; }
    case 'risk-reward': { const r = calculateRiskReward(n('entry'), n('stop'), n('target')); return [metric('Reward / risk', r.rewardRisk, 'number'), metric('Risk / reward', r.riskReward, 'number'), metric('Risk per share', r.risk), metric('Potential reward per share', r.reward), metric('Downside', r.downside, 'percentage'), metric('Potential upside', r.upside, 'percentage')]; }
    case 'partial-sell': { const r = calculatePartialSell(n('quantity'), n('average'), n('current'), n('amount'), mode === 'withdraw' ? 'withdraw' : 'quantity'); return [metric('Sale proceeds', r.proceeds), metric('Shares to sell', r.sharesSold, 'number'), metric('Realised P&L', r.realisedPnl, 'currency', true), metric('Original cost basis', r.originalCost), metric('Remaining shares', r.remainingShares, 'number'), metric('Remaining cost basis', r.remainingCost), metric('Remaining market value', r.remainingValue)]; }
    case 'bonus': { const r = calculateBonus(n('quantity'), n('average'), n('new'), n('held')); return [metric('Total shares after bonus', r.totalShares, 'number'), metric('Whole bonus shares', r.bonusShares, 'number'), metric('Fractional entitlement', r.fractionalEntitlement, 'number'), metric('Adjusted theoretical cost / share', r.adjustedAverage), metric('Original total cost', r.originalCost)]; }
    case 'stock-split': { const r = calculateStockSplit(n('quantity'), n('average'), n('oldFace'), n('newFace')); return [metric('Theoretical new quantity', r.newQuantity, 'number'), metric('Split multiplier', r.multiplier, 'number'), metric('Adjusted theoretical cost / share', r.adjustedAverage), metric('Total cost basis', r.totalCost)]; }
    case 'rights': { const r = calculateRightsIssue(n('quantity'), n('new'), n('held'), n('price'), inputs['average'] ?? undefined); return [metric('Subscription cost', r.subscriptionCost), metric('Rights entitlement', r.entitlement, 'number'), metric('Whole rights shares', r.rightsShares, 'number'), metric('Fractional entitlement', r.fractionalEntitlement, 'number'), metric('New total quantity', r.totalQuantity, 'number'), ...(r.combinedAverage === null || r.combinedInvestment === null ? [] : [metric('Combined investment', r.combinedInvestment), metric('Combined average', r.combinedAverage)])]; }
    case 'pe': {
      if (mode === 'eps') return [metric('Earnings per share', calculateEps(n('price'), n('pe')).eps)];
      if (mode === 'price') return [metric('Implied price', calculateImpliedPrice(n('eps'), n('pe')).price)];
      const r = calculatePe(n('price'), n('eps')); return [metric('Price / earnings', r.pe ?? 'Not meaningful', r.pe === null ? 'text' : 'number'), metric('Interpretation', r.note, 'text')];
    }
    case 'market-cap': { const r = calculateMarketCap(n('price'), n('shares'), n('unit')); return [metric('Market capitalization', r.marketCap), metric('Full market capitalization', new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(r.marketCap), 'text'), metric('Market cap in crores', r.marketCap / 1e7, 'number'), metric('Outstanding shares', r.outstandingShares, 'number')]; }
    case 'investment-growth': { const r = calculateInvestmentGrowth(n('initial'), mode === 'monthly' ? n('monthly') : 0, n('annual'), n('years')); return [metric('Projected final value', r.finalValue), metric('Total contribution', r.contribution), metric('Estimated growth', r.growth, 'currency', true), metric('Wealth multiple', r.multiple, 'number'), metric('Projection months', r.months, 'number')]; }
    default: return [];
  }
}
