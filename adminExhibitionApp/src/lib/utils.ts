import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Timestamp } from 'firebase/firestore';

type FirebaseTimestampLike = {
  toDate: () => Date;
};

function hasToDate(value: unknown): value is FirebaseTimestampLike {
  return !!value && typeof value === 'object' && typeof (value as FirebaseTimestampLike).toDate === 'function';
}

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

export function formatDate(dateVal: Timestamp | Date | string | number | null | undefined): string {
  if (!dateVal) return 'N/A';
  
  let dateObj: Date;
  
  if (dateVal instanceof Timestamp) {
    dateObj = dateVal.toDate();
  } else if (hasToDate(dateVal)) {
    dateObj = dateVal.toDate();
  } else if (dateVal instanceof Date) {
    dateObj = dateVal;
  } else if (typeof dateVal === 'string' || typeof dateVal === 'number') {
    dateObj = new Date(dateVal);
  } else {
    return 'Invalid Date';
  }

  return dateObj.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}