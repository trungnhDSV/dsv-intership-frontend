export interface FileMetadata {
  fileSize: number;
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  uploadedAt: string;
  s3Key: string;
}

export type RadioGroupType = 'borderLine' | 'fill';
export type ShapeType = 'rectangle' | 'ellipse' | 'triangle' | 'circle' | 'line' | 'arrow';
export interface RGBColor {
  r: number;
  g: number;
  b: number;
}
export interface ShapeAnnotationState {
  shapeType: ShapeType;
  strokeColor: RGBColor | null;
  strokeWidth: number;
  fillColor: RGBColor | null;
  opacity: number;
  radioGroup: RadioGroupType;
}
export interface TextAnnotationState {
  text: string;
  fontFamily: string;
  fontSize: number;
  textColor: RGBColor | null;
  strokeColor: RGBColor | null;
  strokeWidth: number;
  opacity: number;
  radioGroup: RadioGroupType;
}
