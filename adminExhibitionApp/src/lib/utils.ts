import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateVal: any): string {
  if (!dateVal) return 'N/A';
  let dateObj = dateVal;
  if (typeof dateVal.toDate === 'function') {
    dateObj = dateVal.toDate();
  } else if (typeof dateVal === 'string' || typeof dateVal === 'number') {
    dateObj = new Date(dateVal);
  }
  return dateObj.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
