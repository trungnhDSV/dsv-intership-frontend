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
  const alphaA = a.a !== undefined ? a.a : 1;
  const alphaB = b.a !== undefined ? b.a : 1;
  return a.r === b.r && a.g === b.g && a.b === b.b && alphaA === alphaB;
}

export function toHex(color?: RGBColor | null): string {
  if (!color) return '000000';
  const hex = (v: number) => v.toString(16).padStart(2, '0');
  const a = color.a !== undefined ? color.a : 255;
  return `${hex(color.r)}${hex(color.g)}${hex(color.b)}${hex(a)}`;
}

const toRGB = (color: Core.Annotations.Color | null | undefined): RGBColor | null => {
  if (!color) return null;
  return {
    r: color.R,
    g: color.G,
    b: color.B,
    a: color.A !== undefined ? color.A : color.A !== undefined ? color.A : 1,
  };
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

export function updateFreeTextAnnotationFields(
  annot: Core.Annotations.FreeTextAnnotation,
  newState: TextAnnotationState,
  Core: (typeof import('@pdftron/webviewer'))['Core']
) {
  let needRedraw = false;
  // FontSize
  if (annot.FontSize !== newState.fontSize.toString()) {
    annot.FontSize = newState.fontSize.toString();
    needRedraw = true;
  }
  // FontFamily
  if (annot.Font !== newState.fontFamily) {
    annot.Font = newState.fontFamily;
    needRedraw = true;
  }
  // TextColor
  if (!isSameColor(toRGB(annot.TextColor), newState.textColor)) {
    annot.TextColor = new Core.Annotations.Color(
      newState.textColor.r ?? 0,
      newState.textColor.g ?? 0,
      newState.textColor.b ?? 0,
      newState.textColor.a !== undefined ? newState.textColor.a : 1
    );
    needRedraw = true;
  }
  // StrokeThickness
  if (annot.StrokeThickness !== newState.strokeWidth) {
    annot.StrokeThickness = newState.strokeWidth;
    needRedraw = true;
  }
  // StrokeColor
  if (!isSameColor(toRGB(annot.StrokeColor), newState.strokeColor)) {
    annot.StrokeColor = new Core.Annotations.Color(
      newState.strokeColor?.r ?? 255,
      newState.strokeColor?.g ?? 255,
      newState.strokeColor?.b ?? 255,
      newState.strokeColor?.a !== undefined ? newState.strokeColor.a : newState.strokeColor ? 1 : 0
    );
    needRedraw = true;
  }
  // FillColor
  if (!isSameColor(toRGB(annot.FillColor), newState.fillColor)) {
    annot.FillColor = new Core.Annotations.Color(
      newState.fillColor?.r ?? 255,
      newState.fillColor?.g ?? 255,
      newState.fillColor?.b ?? 255,
      newState.fillColor?.a !== undefined ? newState.fillColor.a : newState.fillColor ? 1 : 0
    );
    needRedraw = true;
  }
  // Opacity
  if (annot.Opacity !== newState.opacity) {
    annot.Opacity = newState.opacity;
    needRedraw = true;
  }

  return needRedraw;
}

export function updateShapeAnnotationFields(
  annot: Core.Annotations.MarkupAnnotation,
  newState: ShapeAnnotationState,
  Core: (typeof import('@pdftron/webviewer'))['Core']
) {
  let needRedraw = false;

  // StrokeThickness
  if (annot.StrokeThickness !== newState.strokeWidth) {
    annot.StrokeThickness = newState.strokeWidth;
    needRedraw = true;
  }

  // StrokeColor
  if (!isSameColor(toRGB(annot.StrokeColor), newState.strokeColor)) {
    annot.StrokeColor = new Core.Annotations.Color(
      newState.strokeColor?.r ?? 255,
      newState.strokeColor?.g ?? 255,
      newState.strokeColor?.b ?? 255,
      newState.strokeColor?.a !== undefined ? newState.strokeColor.a : newState.strokeColor ? 1 : 0
    );
    needRedraw = true;
  }

  // FillColor
  if (!isSameColor(toRGB(annot.FillColor), newState.fillColor)) {
    annot.FillColor = new Core.Annotations.Color(
      newState.fillColor?.r ?? 255,
      newState.fillColor?.g ?? 255,
      newState.fillColor?.b ?? 255,
      newState.fillColor?.a !== undefined ? newState.fillColor.a : newState.fillColor ? 1 : 0
    );
    needRedraw = true;
  }

  // Opacity
  if (annot.Opacity !== newState.opacity) {
    annot.Opacity = newState.opacity;
    needRedraw = true;
  }

  return needRedraw;
}
