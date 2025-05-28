import { RGBColor, TextAnnotationState } from '@/types/types';
import { useState } from 'react';

export function useTextAnnotationState() {
  const [textState, setTextState] = useState<TextAnnotationState>({
    text: '',
    fontFamily: 'Inter',
    fontSize: 12,
    textColor: { r: 0, g: 0, b: 0 }, // Default stroke BLACK color as RGB object
    strokeColor: null,
    strokeWidth: 0,
    fillColor: null,
    opacity: 1,
    radioGroup: 'fill',
  });

  const setText = (text: string) => setTextState((prev) => ({ ...prev, text }));
  const setFontFamily = (fontFamily: string) => setTextState((prev) => ({ ...prev, fontFamily }));
  const setFontSize = (fontSize: number) => setTextState((prev) => ({ ...prev, fontSize }));
  const setTextColor = (textColor: RGBColor) => setTextState((prev) => ({ ...prev, textColor }));
  const setStrokeColor = (strokeColor: RGBColor | null) =>
    setTextState((prev) => ({ ...prev, strokeColor }));
  const setStrokeWidth = (strokeWidth: number) =>
    setTextState((prev) => ({ ...prev, strokeWidth }));
  const setOpacity = (opacity: number) => setTextState((prev) => ({ ...prev, opacity }));
  const setRadioGroup = (radioGroup: 'borderLine' | 'fill') =>
    setTextState((prev) => ({ ...prev, radioGroup }));
  const reset = () =>
    setTextState({
      text: '',
      fontFamily: 'Inter',
      fontSize: 12,
      textColor: { r: 0, g: 0, b: 0 },
      strokeColor: null,
      strokeWidth: 0,
      opacity: 1,
      fillColor: null,
      radioGroup: 'fill',
    });

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
        setOpacityInput({ value: String(0), isEditing: false });
      } else if (numericValue > 100) {
        setOpacity(1);
        setOpacityInput({ value: String(100), isEditing: false });
      }
    }
    if (type === 'strokeWidth') {
      if (numericValue >= 1 && numericValue <= 50) {
        setStrokeWidth(numericValue);
        setStrokeWidthInput({ value: String(numericValue), isEditing: false });
      } else if (numericValue < 1) {
        setStrokeWidth(1);
        setStrokeWidthInput({ value: String(1), isEditing: false });
      } else if (numericValue > 50) {
        setStrokeWidth(50);
        setStrokeWidthInput({ value: String(50), isEditing: false });
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

  const setTextFillColor = (fillColor: RGBColor | null) =>
    setTextState((prev) => ({ ...prev, fillColor }));

  return {
    textState,
    textOpacityInput: opacityInput,
    textStrokeWidthInput: strokeWidthInput,
    setTextInputOnSubmit: onSubmit,
    setTextInputIsEdit: setIsEdit,
    setTextInputChange: setInputChange,
    setText,
    setFontFamily,
    setFontSize,
    setTextColor,
    setTextStrokeColor: setStrokeColor,
    setTextStrokeWidth: setStrokeWidth,
    setTextFillColor,
    setTextOpacity: setOpacity,
    setTextRadioGroup: setRadioGroup,
    resetText: reset,
  };
}
