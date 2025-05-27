import { RGBColor } from '@/types/types';

export function rgbToString(color: RGBColor): string {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

export function isSameColor(a: RGBColor | null, b: RGBColor | null) {
  if (!a || !b) return false;
  return a.r === b.r && a.g === b.g && a.b === b.b;
}
