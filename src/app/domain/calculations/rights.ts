import { positive, whole, finiteResult } from './validation';
export function calculateRightsIssue(quantity: number, rights: number, held: number, price: number, average?: number) {
  whole(quantity, 'Existing shares'); whole(rights, 'Rights ratio'); whole(held, 'Held ratio'); positive(price, 'Subscription price');
  if (average !== undefined) positive(average, 'Existing average');
  const entitlement = quantity * rights / held, rightsShares = Math.floor(entitlement);
  const subscriptionCost = rightsShares * price, totalQuantity = quantity + rightsShares;
  const combinedInvestment = average === undefined ? null : quantity * average + subscriptionCost;
  return finiteResult({ entitlement, rightsShares, fractionalEntitlement: entitlement - rightsShares, subscriptionCost, totalQuantity,
    combinedInvestment, combinedAverage: combinedInvestment === null ? null : combinedInvestment / totalQuantity });
}
