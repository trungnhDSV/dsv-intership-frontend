import { RGBColor, ShapeAnnotationState, ShapeType, TextAnnotationState } from '@/types/types';
import { Core } from '@pdftron/webviewer';

export type ShapeAnnotations =
  | Core.Annotations.RectangleAnnotation
  | Core.Annotations.EllipseAnnotation
  | Core.Annotations.LineAnnotation
  | Core.Annotations.PolygonAnnotation
  | Core.Annotations.PolylineAnnotation;

export function rgbToString(color: RGBColor): string {
  return `rgb(${color.r}, ${color.g}, ${color.b}, ${color.a || 1})`;
}

export function isSameColor(a: RGBColor | null, b: RGBColor | null) {
  if (!a || !b) return false;
  return a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a;
}

export function toHex(color?: RGBColor | null): string {
  if (!color) return '000000';
  const hex = (v: number) => v.toString(16).padStart(2, '0');
  const a = color.a !== undefined ? color.a : 255;
  return `${hex(color.r)}${hex(color.g)}${hex(color.b)}${hex(a)}`;
}

const toRGB = (color: Core.Annotations.Color | null | undefined): RGBColor | null => {
  if (!color) return null;
  return { r: color.R, g: color.G, b: color.B, a: color.A === 0 ? 0 : 1 };
};
export function extractFreeTextState(
  annot: Core.Annotations.FreeTextAnnotation
): TextAnnotationState {
  return {
    text: annot.getContents() || '',
    fontFamily: annot.Font || 'Inter',
    fontSize: parseFloat(annot.FontSize) || 12,
    textColor: toRGB(annot.TextColor)!,
    strokeColor: toRGB(annot.StrokeColor),
    strokeWidth: annot.StrokeThickness || 1,
    fillColor: toRGB(annot.FillColor),
    opacity: annot.Opacity || 1,
    radioGroup: annot.FillColor ? 'fill' : 'borderLine',
  };
}

export function extractShapeState(annot: ShapeAnnotations): ShapeAnnotationState {
  return {
    shapeType:
      annot.Subject === 'Line'
        ? annot.rn === 'None'
          ? 'line'
          : 'arrow'
        : (annot.Subject.toLowerCase() as ShapeType),
    strokeColor: toRGB(annot.StrokeColor),
    strokeWidth: annot.StrokeThickness || 1,
    fillColor: toRGB(annot.FillColor),
    opacity: annot.Opacity || 1,
    radioGroup: annot.FillColor ? 'fill' : 'borderLine',
  };
}

export function getToolNameFromShapeType(shapeType: ShapeType) {
  switch (shapeType) {
    case 'rectangle':
      return 'AnnotationCreateRectangle';
    case 'ellipse':
      return 'AnnotationCreateEllipse';
    case 'line':
      return 'AnnotationCreateLine';
    case 'arrow':
      return 'AnnotationCreateArrow';
    case 'triangle':
      return 'AnnotationCreateTriangle';
    default:
      return 'AnnotationCreateRectangle';
  }
}
