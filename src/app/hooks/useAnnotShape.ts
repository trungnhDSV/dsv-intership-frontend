import { RGBColor, ShapeAnnotationState, ShapeType } from '@/types/types';
import { useState } from 'react';

export function useShapeAnnotationState() {
  const [shapeState, setShapeState] = useState<ShapeAnnotationState>({
    shapeType: 'rectangle',
    strokeColor: { r: 0, g: 0, b: 0 }, // Default stroke BLACK color as RGB object
    strokeWidth: 1,
    fillColor: null,
    opacity: 1,
    radioGroup: 'fill',
  });

  const setShapeType = (shapeType: ShapeType) => setShapeState((prev) => ({ ...prev, shapeType }));

  const setStrokeColor = (strokeColor: RGBColor | null) =>
    setShapeState((prev) => ({ ...prev, strokeColor }));

  const setStrokeWidth = (strokeWidth: number) =>
    setShapeState((prev) => ({ ...prev, strokeWidth }));

  const setFillColor = (fillColor: RGBColor | null) =>
    setShapeState((prev) => ({ ...prev, fillColor }));

  const setOpacity = (opacity: number) => setShapeState((prev) => ({ ...prev, opacity }));

  const setRadioGroup = (radioGroup: 'borderLine' | 'fill') =>
    setShapeState((prev) => ({ ...prev, radioGroup }));

  const reset = () =>
    setShapeState({
      shapeType: 'rectangle',
      strokeColor: { r: 0, g: 0, b: 0 },
      strokeWidth: 1,
      fillColor: null,
      opacity: 1,
      radioGroup: 'fill',
    });

  // 👇 Input state như text hook
  const [opacityInput, setOpacityInput] = useState({
    value: '100',
    isEditing: false,
  });

  const [strokeWidthInput, setStrokeWidthInput] = useState({
    value: '1',
    isEditing: false,
  });

  const onSubmit = (type: 'opacity' | 'strokeWidth', value: string): void => {
    const numericValue = Math.round(+value);
    if (type === 'opacity') {
      if (numericValue >= 0 && numericValue <= 100) {
        setOpacity(numericValue / 100);
        setOpacityInput({ value: String(numericValue), isEditing: false });
      } else if (numericValue < 0) {
        setOpacity(0);
        setOpacityInput({ value: '0', isEditing: false });
      } else if (numericValue > 100) {
        setOpacity(1);
        setOpacityInput({ value: '100', isEditing: false });
      }
    }

    if (type === 'strokeWidth') {
      if (numericValue >= 1 && numericValue <= 50) {
        setStrokeWidth(numericValue);
        setStrokeWidthInput({ value: String(numericValue), isEditing: false });
      } else if (numericValue < 1) {
        setStrokeWidth(1);
        setStrokeWidthInput({ value: '1', isEditing: false });
      } else if (numericValue > 50) {
        setStrokeWidth(50);
        setStrokeWidthInput({ value: '50', isEditing: false });
      }
    }
  };

  const setIsEdit = (type: 'opacity' | 'strokeWidth', isEditing: boolean): void => {
    if (type === 'opacity') {
      setOpacityInput((prev) => ({ ...prev, isEditing }));
    } else if (type === 'strokeWidth') {
      setStrokeWidthInput((prev) => ({ ...prev, isEditing }));
    }
  };

  const setInputChange = (type: 'opacity' | 'strokeWidth', value: string): void => {
    if (type === 'opacity') {
      setOpacityInput((prev) => ({ ...prev, value }));
    } else if (type === 'strokeWidth') {
      setStrokeWidthInput((prev) => ({ ...prev, value }));
    }
  };

  return {
    shapeState,
    shapeOpacityInput: opacityInput,
    shapeStrokeWidthInput: strokeWidthInput,
    setShapeInputOnSubmit: onSubmit,
    setShapeInputIsEdit: setIsEdit,
    setShapeInputChange: setInputChange,
    setShapeType,
    setShapeStrokeColor: setStrokeColor,
    setShapeStrokeWidth: setStrokeWidth,
    setShapeFillColor: setFillColor,
    setShapeOpacity: setOpacity,
    setShapeRadioGroup: setRadioGroup,
    resetShape: reset,
  };
}
