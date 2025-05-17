import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);

  const dateOptions: Intl.DateTimeFormatOptions = {
    month: 'short', // "Jan", "Feb", ...
    day: 'numeric',
    year: 'numeric',
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };

  const datePart = new Intl.DateTimeFormat('en-US', dateOptions).format(date);
  const timePart = new Intl.DateTimeFormat('en-US', timeOptions).format(date);

  return `${datePart} ${timePart}`;
}
