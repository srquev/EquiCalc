import { calculateWeightedAverage } from './average-price';
import {
  calculateAverageDown,
  calculateTargetAverage,
  calculateAveragingScenarios,
} from './average-down';
import { calculateBreakEven, calculateRecovery } from './break-even';
import { calculateProfitLoss } from './profit-loss';
import { calculatePosition } from './position';
import { calculateTargetReturn } from './target-return';
import { calculateCagr } from './cagr';
import { calculateDividend } from './dividend';
import { calculatePositionSize } from './position-size';
import { calculateRiskReward } from './risk-reward';
import { calculatePartialSell } from './partial-sell';
import { calculateBonus } from './bonus';
import { calculateStockSplit } from './stock-split';
import { calculateRightsIssue } from './rights';
import { calculatePe, calculateEps, calculateImpliedPrice } from './pe';
import { calculateMarketCap } from './market-cap';
import { calculateInvestmentGrowth } from './investment-growth';
import { CalculationError } from './validation';

const position = { quantity: 100, averagePrice: 500, currentPrice: 350 };
describe('Framework-independent calculation engine', () => {
  describe('weighted average', () => {
    it('weights purchases by quantity', () => {
      expect(
        calculateWeightedAverage([
          { quantity: 100, price: 500 },
          { quantity: 100, price: 400 },
        ]).average,
      ).toBe(450);
      const unequal = calculateWeightedAverage([
        { quantity: 100, price: 500 },
        { quantity: 50, price: 400 },
      ]);
      expect(unequal.average).toBeCloseTo(466.6666667, 6);
      expect(unequal.investment).toBe(70000);
      expect(unequal.contributions.reduce((a, b) => a + b)).toBeCloseTo(
        100,
        10,
      );
    });
    it('requires one to fifty valid lots', () => {
      expect(() => calculateWeightedAverage([])).toThrowError(CalculationError);
      expect(() =>
        calculateWeightedAverage([{ quantity: 0, price: 500 }]),
      ).toThrowError(CalculationError);
      expect(() =>
        calculateWeightedAverage(
          Array.from({ length: 51 }, () => ({ quantity: 1, price: 1 })),
        ),
      ).toThrowError(CalculationError);
    });
  });
  describe('position and recovery', () => {
    it('matches the reference position exactly', () => {
      const r = calculatePosition(position);
      expect(r.investment).toBe(50000);
      expect(r.value).toBe(35000);
      expect(r.netPnl).toBe(-15000);
      expect(r.returnPercentage).toBeCloseTo(-30, 10);
      expect(r.recovery).toBeCloseTo(42.857142857, 8);
    });
    it('does not imply negative recovery and represents zero prices explicitly', () => {
      expect(calculateRecovery(500, 600)).toBe(0);
      expect(calculateRecovery(500, 500)).toBe(0);
      expect(calculateBreakEven(500, 0).recovery).toBeNull();
      expect(calculateBreakEven(500, 350).pnl).toBeNull();
      expect(calculateBreakEven(500, 350, 100).pnl).toBe(-15000);
      expect(() => calculateRecovery(500, 0)).toThrowError(CalculationError);
    });
  });
  describe('average down', () => {
    it('uses whole shares and reports real capital used', () => {
      const r = calculateAverageDown(position, 20000);
      expect(r.additionalShares).toBe(57);
      expect(r.additionalInvestmentUsed).toBe(19950);
      expect(r.unusedCapital).toBe(50);
      expect(r.totalQuantity).toBe(157);
      expect(r.totalInvestment).toBe(69950);
      expect(r.newAverage).toBeCloseTo(445.541401273885, 10);
      expect(r.newRecoveryPercentage).toBeCloseTo(27.29754322111, 8);
      expect(r.currentPnl).toBe(-15000);
      expect(r.totalQuantity * position.currentPrice - r.totalInvestment).toBe(
        r.currentPnl,
      );
    });
    it('does not spend money without enough budget', () => {
      expect(calculateAverageDown(position, 349).additionalShares).toBe(0);
      expect(calculateAverageDown(position, 350).additionalShares).toBe(1);
      expect(calculateAverageDown(position, 0).newAverage).toBe(500);
      expect(calculateAverageDown(position, 699.999).additionalShares).toBe(1);
      expect(
        calculateAverageDown(
          { quantity: 1, averagePrice: 1, currentPrice: 0.1 },
          0.3,
        ).additionalShares,
      ).toBe(3);
    });
    it('supports adding above average without calling the increase a reduction', () => {
      const r = calculateAverageDown({ ...position, currentPrice: 600 }, 6000);
      expect(r.averageReduction).toBeLessThan(0);
      expect(r.newRecoveryPercentage).toBe(0);
    });
    it('calculates nearby scenarios using actual whole shares', () => {
      const rows = calculateAveragingScenarios(position, 20000);
      expect(rows.map((r) => r.budget)).toEqual([
        5000, 10000, 20000, 30000, 50000,
      ]);
      expect(rows[2].newAverage).toBe(
        calculateAverageDown(position, 20000).newAverage,
      );
      expect(rows.map((r) => r.additionalShares)).toEqual([
        14, 28, 57, 85, 142,
      ]);
    });
    it('finds a target using the minimum whole shares that meet it', () => {
      const r = calculateTargetAverage(position, 400);
      expect(r.additionalShares).toBe(200);
      expect(r.newAverage).toBe(400);
      expect(r.investmentRequired).toBe(70000);
      const rounded = calculateTargetAverage(position, 421);
      expect(rounded.additionalShares).toBe(112);
      expect(rounded.newAverage).toBeLessThanOrEqual(421);
      expect((50000 + 111 * 350) / 211).toBeGreaterThan(421);
    });
    it('rejects unreachable targets', () => {
      for (const target of [0, 300, 350, 500, 600])
        expect(() => calculateTargetAverage(position, target)).toThrowError(
          CalculationError,
        );
    });
  });
  it('calculates net profit and loss including charges', () => {
    const profit = calculateProfitLoss(500, 600, 100, 200);
    expect(profit.grossPnl).toBe(10000);
    expect(profit.netPnl).toBe(9800);
    expect(profit.returnPercentage).toBeCloseTo(19.6);
    expect(calculateProfitLoss(500, 350, 100).netPnl).toBe(-15000);
    expect(calculateProfitLoss(500, 0, 100).returnPercentage).toBe(-100);
    expect(() => calculateProfitLoss(500, 600, 1.5)).toThrowError(
      CalculationError,
    );
  });
  it('converts target return in either direction', () => {
    expect(calculateTargetReturn(500, 100, 20).targetPrice).toBe(600);
    expect(
      calculateTargetReturn(500, 100, 600, 'price').returnPercentage,
    ).toBeCloseTo(20);
    expect(calculateTargetReturn(500, 100, -100).targetPrice).toBe(0);
    expect(() => calculateTargetReturn(500, 100, -101)).toThrowError(
      CalculationError,
    );
  });
  it('calculates CAGR for growth, loss, zero and decimal durations', () => {
    expect(calculateCagr(100, 121, 2).cagr).toBeCloseTo(10, 10);
    expect(calculateCagr(100, 81, 2).cagr).toBeCloseTo(-10, 10);
    expect(calculateCagr(100, 110, 0.5).cagr).toBeCloseTo(21, 10);
    expect(calculateCagr(100, 0, 5).cagr).toBe(-100);
    expect(calculateCagr(100000, 250000, 5).multiple).toBe(2.5);
    expect(() => calculateCagr(0, 100, 5)).toThrowError(CalculationError);
    expect(() => calculateCagr(100, 200, 0)).toThrowError(CalculationError);
  });
  it('annualizes dividends based on payment frequency', () => {
    const r = calculateDividend(100, 500, 600, 5, 4);
    expect(r.annualIncome).toBe(2000);
    expect(r.yieldOnCost).toBe(4);
    expect(r.currentYield).toBeCloseTo(3.333333333, 8);
    expect(calculateDividend(100, 500, 600, 0).annualIncome).toBe(0);
    expect(() => calculateDividend(100, 500, 600, 5, 3)).toThrowError(
      CalculationError,
    );
  });
  it('sizes long positions within risk and capital constraints', () => {
    const r = calculatePositionSize(500000, 1, 500, 475);
    expect(r.maximumRisk).toBe(5000);
    expect(r.riskPerShare).toBe(25);
    expect(r.maximumShares).toBe(200);
    expect(r.positionValue).toBe(100000);
    expect(r.allocation).toBe(20);
    expect(calculatePositionSize(1000, 10, 500, 499).maximumShares).toBe(2);
    expect(() => calculatePositionSize(1000, 1, 500, 500)).toThrowError(
      CalculationError,
    );
    expect(() => calculatePositionSize(1000, 1, 500, 550)).toThrowError(
      CalculationError,
    );
  });
  it('calculates both risk-reward directions', () => {
    const r = calculateRiskReward(500, 450, 600);
    expect(r.risk).toBe(50);
    expect(r.reward).toBe(100);
    expect(r.rewardRisk).toBe(2);
    expect(r.riskReward).toBe(0.5);
    expect(r.downside).toBe(10);
    expect(r.upside).toBe(20);
    expect(() => calculateRiskReward(500, 500, 600)).toThrowError(
      CalculationError,
    );
    expect(() => calculateRiskReward(500, 450, 400)).toThrowError(
      CalculationError,
    );
  });
  it('handles partial and full sales and rounds withdrawals up', () => {
    const r = calculatePartialSell(100, 500, 600, 25);
    expect(r.realisedPnl).toBe(2500);
    expect(r.remainingShares).toBe(75);
    expect(r.remainingCost).toBe(37500);
    expect(r.remainingValue).toBe(45000);
    const withdrawal = calculatePartialSell(100, 500, 600, 10000, 'withdraw');
    expect(
      calculatePartialSell(100, 0.02, 0.01, 0.07, 'withdraw').sharesSold,
    ).toBe(7);
    expect(withdrawal.sharesSold).toBe(17);
    expect(withdrawal.proceeds).toBe(10200);
    expect(calculatePartialSell(100, 500, 350, 100).remainingShares).toBe(0);
    expect(() => calculatePartialSell(100, 500, 600, 101)).toThrowError(
      CalculationError,
    );
    expect(() =>
      calculatePartialSell(100, 500, 600, 60001, 'withdraw'),
    ).toThrowError(CalculationError);
  });
  it('calculates bonus shares and fractional entitlements separately', () => {
    const r = calculateBonus(100, 500, 1, 1);
    expect(r.bonusShares).toBe(100);
    expect(r.totalShares).toBe(200);
    expect(r.adjustedAverage).toBe(250);
    expect(r.originalCost).toBe(50000);
    expect(calculateBonus(101, 500, 3, 5).fractionalEntitlement).toBeCloseTo(
      0.6,
    );
    expect(() => calculateBonus(100, 500, 1, 0)).toThrowError(CalculationError);
  });
  it('preserves total cost after a split and supports reverse splits', () => {
    const r = calculateStockSplit(100, 500, 10, 2);
    expect(r.multiplier).toBe(5);
    expect(r.newQuantity).toBe(500);
    expect(r.adjustedAverage).toBe(100);
    expect(r.totalCost).toBe(50000);
    expect(calculateStockSplit(100, 500, 2, 10).newQuantity).toBe(20);
    expect(() => calculateStockSplit(100, 500, 10, 0)).toThrowError(
      CalculationError,
    );
  });
  it('calculates rights with and without the optional existing cost', () => {
    const r = calculateRightsIssue(100, 1, 4, 300, 500);
    expect(r.rightsShares).toBe(25);
    expect(r.subscriptionCost).toBe(7500);
    expect(r.totalQuantity).toBe(125);
    expect(r.combinedAverage).toBe(460);
    expect(calculateRightsIssue(100, 1, 4, 300).combinedAverage).toBeNull();
    expect(calculateRightsIssue(101, 1, 4, 300).fractionalEntitlement).toBe(
      0.25,
    );
  });
  it('calculates P/E, EPS and implied price without classifying valuations', () => {
    expect(calculatePe(500, 25).pe).toBe(20);
    expect(calculateEps(500, 20).eps).toBe(25);
    expect(calculateImpliedPrice(25, 20).price).toBe(500);
    expect(calculatePe(500, -25).pe).toBeNull();
    expect(() => calculatePe(500, 0)).toThrowError(CalculationError);
    expect(() => calculateEps(500, 0)).toThrowError(CalculationError);
  });
  it('calculates market capitalization across share-count units', () => {
    expect(calculateMarketCap(500, 10, 10000000).marketCap).toBe(50000000000);
    expect(calculateMarketCap(500, 100, 1000000).marketCap).toBe(50000000000);
    expect(calculateMarketCap(500, 100000000).marketCap).toBe(50000000000);
    expect(() => calculateMarketCap(500, 1, 7)).toThrowError(CalculationError);
  });
  it('projects growth with effective monthly compounding and end-month contributions', () => {
    expect(calculateInvestmentGrowth(100000, 0, 10, 2).finalValue).toBeCloseTo(
      121000,
      6,
    );
    const zero = calculateInvestmentGrowth(1000, 100, 0, 2);
    expect(zero.contribution).toBe(3400);
    expect(zero.finalValue).toBe(3400);
    expect(zero.growth).toBe(0);
    expect(zero.projection.length).toBe(2);
    const rate = Math.pow(1.1, 1 / 12) - 1;
    expect(calculateInvestmentGrowth(0, 100, 10, 1).finalValue).toBeCloseTo(
      (100 * (Math.pow(1 + rate, 12) - 1)) / rate,
      7,
    );
    expect(calculateInvestmentGrowth(100, 0, -10, 1).finalValue).toBeCloseTo(
      90,
      10,
    );
    expect(
      calculateInvestmentGrowth(100, 0, 10, 1.5).projection.at(-1)?.year,
    ).toBe(1.5);
    expect(() => calculateInvestmentGrowth(0, 0, 10, 1)).toThrowError(
      CalculationError,
    );
    expect(() => calculateInvestmentGrowth(100, 0, -100, 1)).toThrowError(
      CalculationError,
    );
    expect(() => calculateInvestmentGrowth(100, 0, 10, 101)).toThrowError(
      CalculationError,
    );
  });
  it('rejects invalid numerical inputs and values beyond supported precision', () => {
    for (const value of [NaN, Infinity, -Infinity, -1]) {
      expect(() => calculateProfitLoss(value, 500, 100)).toThrowError(
        CalculationError,
      );
      expect(() => calculateCagr(100, value, 5)).toThrowError(CalculationError);
      expect(() => calculateAverageDown(position, value)).toThrowError(
        CalculationError,
      );
    }
    expect(() => calculateMarketCap(1e15, 1e15)).toThrowError(CalculationError);
    expect(() => calculateCagr(1, 1e15, 0.001)).toThrowError(CalculationError);
    expect(calculateProfitLoss(1000000, 2000000, 1000000).netPnl).toBe(1e12);
  });
});
