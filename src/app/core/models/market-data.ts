export interface CompanySearchResult {
  readonly symbol: string;
  readonly name: string;
  readonly exchange: string;
}
export interface MarketQuote {
  readonly symbol: string;
  readonly price: number;
  readonly currency: string;
  readonly asOf: string;
}
export interface MarketDataProvider {
  searchCompanies(query: string): Promise<readonly CompanySearchResult[]>;
  getQuote(symbol: string): Promise<MarketQuote>;
}
