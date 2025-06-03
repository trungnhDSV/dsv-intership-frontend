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

export const handleTranslationError = (t: (arg: string) => string, detail: string) => {
  switch (detail) {
    case 'Invalid email or password':
      return t('invalidSignIn');
    case 'Mandatory field':
      return t('mandatoryField');
    case 'You must accept the terms':
      return t('mustAccept');
    case 'Passwords must be the same':
      return t('mustSamePass');
    case 'Password must be at least 8 characters long':
      return t('mustPassLength');
    default:
      console.error('Translation error:', detail);
      return 'Unset';
  }
};
