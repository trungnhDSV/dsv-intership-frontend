import { ShapeAnnotationState, TextAnnotationState } from '@/types/types';

export const TextAnnoInitState: TextAnnotationState = {
  text: '',
  fontFamily: 'Inter',
  fontSize: 12,
  textColor: { r: 0, g: 0, b: 0 }, // Default stroke BLACK color as RGB object
  strokeColor: null,
  strokeWidth: 0,
  fillColor: null,
  opacity: 1,
  radioGroup: 'fill',
};

export const ShapeAnnoInitState: ShapeAnnotationState = {
  shapeType: 'rectangle',
  strokeColor: { r: 0, g: 0, b: 0 }, // Default stroke BLACK color as RGB object
  strokeWidth: 1,
  fillColor: null,
  opacity: 1,
  radioGroup: 'fill',
};
