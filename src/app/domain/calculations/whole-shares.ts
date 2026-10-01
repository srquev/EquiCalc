/** Correct only floating-point noise at an exact whole-share boundary. */
export function purchasableShares(budget: number, price: number): number {
  const shares = Math.floor(budget / price);
  const nextCost = (shares + 1) * price;
  const tolerance =
    Number.EPSILON * Math.max(Math.abs(budget), Math.abs(nextCost)) * 2;
  return nextCost <= budget + tolerance ? shares + 1 : shares;
}

export function sharesForWithdrawal(amount: number, price: number): number {
  const shares = Math.ceil(amount / price);
  const previousProceeds = (shares - 1) * price;
  const tolerance =
    Number.EPSILON * Math.max(Math.abs(amount), Math.abs(previousProceeds)) * 2;
  return shares > 1 && previousProceeds + tolerance >= amount
    ? shares - 1
    : shares;
}
