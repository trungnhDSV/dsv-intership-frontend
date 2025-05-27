import { RGBColor } from '@/types/types';

export const NavbarHeight = 64;
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export const FONT_FAMILY_OPTIONS = [
  { label: 'Arimo', value: 'Arimo' },
  { label: 'EB Garamond', value: 'EB Garamond' },
  { label: 'Inter', value: 'Inter' },
  { label: 'Lora', value: 'Lora' },
  { label: 'Merriweather', value: 'Merriweather' },
  { label: 'Montserrat', value: 'Montserrat' },
  { label: 'Noto Sans', value: 'Noto Sans' },
];
export const FONT_SIZE_OPTIONS = [
  { label: '8pt', value: 8 },
  { label: '10pt', value: 10 },
  { label: '12pt', value: 12 },
  { label: '14pt', value: 14 },
  { label: '16pt', value: 16 },
  { label: '18pt', value: 18 },
  { label: '20pt', value: 20 },
];
export const COLOR_OPTIONS: {
  label: string;
  value: RGBColor;
}[] = [
  { label: 'Black', value: { r: 0, g: 0, b: 0 } },
  { label: 'Red', value: { r: 215, g: 48, b: 39 } },
  { label: 'Blue', value: { r: 69, g: 117, b: 180 } },
  { label: 'Teal', value: { r: 90, g: 180, b: 172 } },
  { label: 'Yellow', value: { r: 254, g: 224, b: 144 } },
  { label: 'Light Blue', value: { r: 224, g: 243, b: 248 } },
  { label: 'White', value: { r: 255, g: 255, b: 255 } },
];
