import { SavedCalculation } from '../models/calculation';
import { isRecord } from './storage';
import { getCalculator } from '../config/calculators';
export function validSaved(value: unknown): value is SavedCalculation {
  if (!isRecord(value)) return false;
  return typeof value['id'] === 'string' && typeof value['label'] === 'string' && value['label'].length <= 120 &&
    typeof value['calculatorId'] === 'string' && !!getCalculator(value['calculatorId']) &&
    typeof value['mode'] === 'string' && typeof value['createdAt'] === 'string' && Number.isFinite(Date.parse(value['createdAt'])) &&
    typeof value['updatedAt'] === 'string' && Number.isFinite(Date.parse(value['updatedAt'])) &&
    isRecord(value['inputs']) && Object.values(value['inputs']).every(n => n === null || (typeof n === 'number' && Number.isFinite(n))) &&
    Array.isArray(value['lots']) && value['lots'].length <= 50 && value['lots'].every(lot => isRecord(lot) && typeof lot['quantity'] === 'number' && Number.isFinite(lot['quantity']) && typeof lot['price'] === 'number' && Number.isFinite(lot['price'])) &&
    Array.isArray(value['metrics']) && value['metrics'].length > 0 && value['metrics'].length <= 30 && value['metrics'].every(m => isRecord(m) && typeof m['label'] === 'string' && (typeof m['value'] === 'string' || (typeof m['value'] === 'number' && Number.isFinite(m['value']))) && ['currency', 'percentage', 'number', 'text'].includes(String(m['format'])));
}
export const validSavedList = (v: unknown): v is SavedCalculation[] => Array.isArray(v) && v.length <= 200 && v.every(validSaved);
export function savedRecord(snapshot: Omit<SavedCalculation, 'id' | 'createdAt' | 'updatedAt'>): SavedCalculation {
  const now = new Date().toISOString();
  return { ...snapshot, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
}
