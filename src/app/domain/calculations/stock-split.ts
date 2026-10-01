import { positive, whole, finiteResult } from './validation';
export function calculateStockSplit(quantity: number, average: number, oldFace: number, newFace: number) {
  whole(quantity, 'Shares'); positive(average, 'Cost per share'); positive(oldFace, 'Old face value'); positive(newFace, 'New face value');
  const multiplier = oldFace / newFace;
  return finiteResult({ multiplier, newQuantity: quantity * multiplier, adjustedAverage: average / multiplier, totalCost: quantity * average });
}
