export type CalculatorCategory =
  | 'Portfolio'
  | 'Returns'
  | 'Income'
  | 'Risk'
  | 'Corporate Actions'
  | 'Valuation';
export interface CalculatorDefinition {
  readonly id: string;
  readonly title: string;
  readonly shortTitle: string;
  readonly description: string;
  readonly category: CalculatorCategory;
  readonly route: string;
  readonly icon: string;
  readonly keywords: readonly string[];
  readonly featured?: boolean;
}
const define = (
  id: string,
  title: string,
  description: string,
  category: CalculatorCategory,
  icon: string,
  keywords: string[],
  featured = false,
): CalculatorDefinition => ({
  id,
  title,
  shortTitle: title,
  description,
  category,
  icon,
  keywords,
  featured,
  route: `/calculators/${id}`,
});
export const CALCULATORS: readonly CalculatorDefinition[] = [
  define(
    'average-down',
    'Average Down',
    'See how adding to a position changes your average and recovery.',
    'Portfolio',
    'trend-down',
    ['averaging', 'target average', 'additional investment'],
    true,
  ),
  define(
    'stock-average',
    'Stock Average',
    'One clear average across all your purchases.',
    'Portfolio',
    'layers',
    ['weighted', 'purchase', 'average price'],
    true,
  ),
  define(
    'break-even',
    'Break Even',
    'Understand the price and recovery needed to break even.',
    'Portfolio',
    'target',
    ['recovery', 'loss'],
    true,
  ),
  define(
    'profit-loss',
    'Profit & Loss',
    'Know your returns, with charges accounted for.',
    'Returns',
    'chart',
    ['pnl', 'profit', 'sell'],
    true,
  ),
  define(
    'target-return',
    'Target Return',
    'Translate a return into a target price, or work backwards.',
    'Returns',
    'flag',
    ['percentage', 'goal'],
  ),
  define(
    'cagr',
    'CAGR',
    'Measure how your investment has grown over time.',
    'Returns',
    'trend-up',
    ['compound', 'annual', 'growth'],
    true,
  ),
  define(
    'sip',
    'SIP & Compounding',
    'Explore monthly investing, contribution step-ups and the path to a goal.',
    'Returns',
    'sprout',
    [
      'sip',
      'systematic investment',
      'compound interest',
      'compounding',
      'step up sip',
      'sip increase',
      'investment growth',
      'monthly investment',
      'future value',
      'goal',
      'crorepati',
      'wealth',
      'inflation',
    ],
    true,
  ),
  define(
    'dividend',
    'Dividend',
    'Calculate dividend income and your yield on cost.',
    'Income',
    'coins',
    ['yield', 'income'],
  ),
  define(
    'position-size',
    'Position Size',
    'Calculate a position from your capital and risk limits.',
    'Risk',
    'pie',
    ['stop loss', 'allocation'],
  ),
  define(
    'risk-reward',
    'Risk / Reward',
    'Compare potential upside and downside per share.',
    'Risk',
    'scale',
    ['ratio', 'stop'],
  ),
  define(
    'partial-sell',
    'Partial Sell',
    'Explore a sale and understand your remaining position.',
    'Portfolio',
    'divide',
    ['withdraw', 'realised'],
  ),
  define(
    'bonus',
    'Bonus',
    'Understand share entitlements and adjusted cost after a bonus.',
    'Corporate Actions',
    'gift',
    ['ratio', 'bonus shares'],
  ),
  define(
    'stock-split',
    'Stock Split',
    'Calculate share quantity and cost after a split.',
    'Corporate Actions',
    'split',
    ['face value', 'reverse split'],
  ),
  define(
    'rights',
    'Rights Issue',
    'Work out entitlements, subscription cost and combined average.',
    'Corporate Actions',
    'file',
    ['subscription', 'entitlement'],
  ),
  define(
    'pe',
    'P/E',
    'Calculate price-to-earnings, EPS or an implied price.',
    'Valuation',
    'percent',
    ['earnings', 'eps'],
  ),
  define(
    'market-cap',
    'Market Cap',
    'Calculate a company’s equity market capitalization.',
    'Valuation',
    'building',
    ['capitalisation', 'outstanding shares'],
  ),
  define(
    'investment-growth',
    'Investment Growth',
    'Explore lump sum and monthly contribution projections.',
    'Returns',
    'sprout',
    ['sip', 'future value', 'compound'],
  ),
];
export const CATEGORIES: readonly CalculatorCategory[] = [
  'Portfolio',
  'Returns',
  'Income',
  'Risk',
  'Corporate Actions',
  'Valuation',
];
export const getCalculator = (id: string) =>
  CALCULATORS.find((item) => item.id === id);
