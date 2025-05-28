import { useShapeAnnotationState } from '@/app/hooks/useAnnotShape';
import { Slider } from '@/components/ui/slider';
import { COLOR_OPTIONS } from '@/constants/UI';
import { rgbToString, isSameColor } from '@/lib/annotations/annotationStyle';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu';
import { ChevronDown } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

interface ShapeAnnotControlProps {
  shapeState: ReturnType<typeof useShapeAnnotationState>['shapeState'];
  shapeOpacityInput: ReturnType<typeof useShapeAnnotationState>['shapeOpacityInput'];
  shapeStrokeWidthInput: ReturnType<typeof useShapeAnnotationState>['shapeStrokeWidthInput'];
  setShapeInputOnSubmit: ReturnType<typeof useShapeAnnotationState>['setShapeInputOnSubmit'];
  setShapeInputIsEdit: ReturnType<typeof useShapeAnnotationState>['setShapeInputIsEdit'];
  setShapeInputChange: ReturnType<typeof useShapeAnnotationState>['setShapeInputChange'];
  setShapeType: ReturnType<typeof useShapeAnnotationState>['setShapeType'];
  setShapeStrokeColor: ReturnType<typeof useShapeAnnotationState>['setShapeStrokeColor'];
  setShapeStrokeWidth: ReturnType<typeof useShapeAnnotationState>['setShapeStrokeWidth'];
  setShapeFillColor: ReturnType<typeof useShapeAnnotationState>['setShapeFillColor'];
  setShapeOpacity: ReturnType<typeof useShapeAnnotationState>['setShapeOpacity'];
  setShapeRadioGroup: ReturnType<typeof useShapeAnnotationState>['setShapeRadioGroup'];
  forSpecificAnnot?: boolean;
}
const ShapeAnnotControl = ({
  shapeState,
  shapeOpacityInput,
  shapeStrokeWidthInput,
  setShapeInputOnSubmit,
  setShapeInputIsEdit,
  setShapeInputChange,
  setShapeType,
  setShapeStrokeColor,
  setShapeStrokeWidth,
  setShapeFillColor,
  setShapeOpacity,
  setShapeRadioGroup,
  forSpecificAnnot = false,
}: ShapeAnnotControlProps) => {
  return (
    <DropdownMenu defaultOpen={forSpecificAnnot}>
      <DropdownMenuTrigger>
        {!forSpecificAnnot ? <ChevronDown className='w-5 h-5' /> : <></>}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='end'
        className='my-3 bg-[#F5F5F5] border-[1px] border-[#D9D9D9] shadow-md w-[324px] rounded-lg p-4'
      >
        <div>
          <div className='flex flex-col gap-4'>
            {!forSpecificAnnot && (
              <div className='flex flex-col gap-2'>
                <p className='text-sm'>Shape</p>
                <div className='flex gap-1'>
                  <button
                    className={cn(
                      'p-1 rounded-lg cursor-pointer hover:bg-[#F2DADE]/70',
                      shapeState.shapeType === 'rectangle' ? 'bg-[#F2DADE]' : 'opacity-50'
                    )}
                    onClick={() => setShapeType('rectangle')}
                  >
                    <Image
                      src='/icons/md_rectangle.svg'
                      alt='rectangle'
                      width={24}
                      height={24}
                      className='w-6 h-6'
                    />
                  </button>
                  <button
                    className={cn(
                      'p-1 rounded-lg cursor-pointer hover:bg-[#F2DADE]/70',
                      shapeState.shapeType === 'ellipse' && 'bg-[#F2DADE]'
                    )}
                    onClick={() => setShapeType('ellipse')}
                  >
                    <Image
                      src='/icons/md_ellipse.svg'
                      alt='ellipse'
                      width={24}
                      height={24}
                      className='w-6 h-6'
                    />
                  </button>
                  <button
                    className={cn(
                      'p-1 rounded-lg cursor-pointer hover:bg-[#F2DADE]/70',
                      shapeState.shapeType === 'triangle' && 'bg-[#F2DADE]'
                    )}
                    onClick={() => setShapeType('triangle')}
                  >
                    <Image
                      src='/icons/md_triangle.svg'
                      alt='triangle'
                      width={24}
                      height={24}
                      className='w-6 h-6'
                    />
                  </button>
                  <button
                    className={cn(
                      'p-1 rounded-lg cursor-pointer hover:bg-[#F2DADE]/70',
                      shapeState.shapeType === 'line' && 'bg-[#F2DADE]'
                    )}
                    onClick={() => setShapeType('line')}
                  >
                    <Image
                      src='/icons/md_line.svg'
                      alt='line'
                      width={24}
                      height={24}
                      className='w-6 h-6'
                    />
                  </button>
                  <button
                    className={cn(
                      'p-1 rounded-lg cursor-pointer hover:bg-[#F2DADE]/70',
                      shapeState.shapeType === 'arrow' && 'bg-[#F2DADE]'
                    )}
                    onClick={() => setShapeType('arrow')}
                  >
                    <Image
                      src='/icons/md_arrow.svg'
                      alt='arrow'
                      width={24}
                      height={24}
                      className='w-6 h-6'
                    />
                  </button>
                </div>
              </div>
            )}
            <div className='flex flex-col gap-4'>
              <div className='flex flex-col gap-2'>
                <p className='text-sm'>Frame style</p>
                {/* radio group */}
                <div className='w-full flex bg-white rounded-full'>
                  <button
                    className={cn(
                      'flex-1 py-2 text-center rounded-full text-sm font-semibold text-[#757575]',
                      shapeState.radioGroup === 'fill' && 'bg-[#D9D9D9] text-[#012832]'
                    )}
                    onClick={() => setShapeRadioGroup('fill')}
                  >
                    Fill
                  </button>
                  <button
                    className={cn(
                      'flex-1 py-2 text-center rounded-full text-sm font-semibold text-[#757575]',
                      shapeState.radioGroup === 'borderLine' && 'bg-[#D9D9D9] text-[#012832]'
                    )}
                    onClick={() => setShapeRadioGroup('borderLine')}
                  >
                    Border Line
                  </button>
                </div>

                {/* COLOR */}
                <div className='flex justify-between items-center'>
                  <div
                    className={cn(
                      'w-[30px] h-[30px] p-1 rounded-full flex items-center justify-center',
                      shapeState.radioGroup === 'fill'
                        ? (!shapeState.fillColor || shapeState.fillColor.a === 0) &&
                            'ring-1 ring-[#161C21]'
                        : (!shapeState.strokeColor || shapeState.strokeColor.a === 0) &&
                            'ring-1 ring-[#161C21]'
                    )}
                    key={'colorNone'}
                    onClick={() =>
                      shapeState.radioGroup === 'fill'
                        ? setShapeFillColor(null)
                        : setShapeStrokeColor(null)
                    }
                  >
                    <Image
                      src='/icons/Circle.png'
                      alt='no color'
                      width={24}
                      height={24}
                      className='w-6 h-6'
                    />
                  </div>
                  {COLOR_OPTIONS.map((color) => {
                    const isActive =
                      shapeState.radioGroup === 'borderLine'
                        ? isSameColor(color.value, shapeState.strokeColor)
                        : isSameColor(color.value, shapeState.fillColor);
                    return (
                      <div
                        key={color.label}
                        onClick={() =>
                          shapeState.radioGroup === 'fill'
                            ? setShapeFillColor(color.value)
                            : setShapeStrokeColor(color.value)
                        }
                        className={cn(
                          'w-[30px] h-[30px] p-1 rounded-full flex items-center justify-center',
                          isActive && 'ring-1 ring-[#161C21]'
                        )}
                      >
                        <div
                          className='w-6 h-6 rounded-full ring-1 ring-[#D9D9D9]'
                          style={{
                            backgroundColor: rgbToString(color.value),
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
                {shapeState.radioGroup === 'borderLine' && (
                  <div className='flex items-center gap-4'>
                    <Image
                      src='/icons/md_stroke.png'
                      className='w-6 h-6'
                      alt='stroke'
                      width={24}
                      height={24}
                    />
                    <Slider
                      value={[shapeState.strokeWidth]}
                      onValueChange={(value) => {
                        setShapeStrokeWidth(value[0]);
                        setShapeInputChange('strokeWidth', value[0].toString());
                      }}
                      max={50}
                      step={1}
                      className={cn(
                        'flex-1 h-1',
                        // Track (nền)
                        '[&_[data-slot=slider-track]]:bg-[#BCCFDC]',
                        // Range (đã chọn)
                        '[&_[data-slot=slider-range]]:bg-[#325167]',
                        // Thumb (nút kéo)
                        '[&_[data-slot=slider-thumb]]:h-4 [&_[data-slot=slider-thumb]]:w-4 [&_[data-slot=slider-thumb]]:bg-[#2B3137]'
                      )}
                    />
                    {/* <span className='w-fit text-[12px] px-2 py-1 border-[1px] border-[#BCCFDC] rounded-md'>
                            {shapeState.strokeWidth} pt
                          </span> */}
                    <button
                      className='w-fit text-[12px] px-2 py-1 border-[1px] border-[#BCCFDC] rounded-md'
                      onDoubleClick={() => setShapeInputIsEdit('strokeWidth', true)}
                    >
                      {shapeStrokeWidthInput.isEditing ? (
                        <input
                          type='number'
                          min={1}
                          max={50}
                          value={shapeStrokeWidthInput.value}
                          onChange={(e) => setShapeInputChange('strokeWidth', e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setShapeInputIsEdit('strokeWidth', false);
                              setShapeInputOnSubmit('strokeWidth', e.currentTarget.value);
                            }
                          }}
                          onBlur={(e) => {
                            setShapeInputIsEdit('strokeWidth', false);
                            setShapeInputOnSubmit('strokeWidth', e.currentTarget.value);
                          }}
                          className='w-fit text-[12px] border-none outline-none'
                          autoFocus
                        />
                      ) : (
                        `${shapeState.strokeWidth} pt`
                      )}
                    </button>
                  </div>
                )}
              </div>
              <div className='flex flex-col gap-2'>
                <p className='text-sm'>Opacity</p>
                <div className='flex items-center gap-4'>
                  <Slider
                    value={[Math.round(shapeState.opacity * 100)]}
                    onValueChange={(value) => {
                      setShapeOpacity(value[0] / 100);
                      setShapeInputChange('opacity', (value[0] / 100).toString());
                    }}
                    max={100}
                    step={1}
                    className={cn(
                      'flex-1 h-1',
                      // Track: gradient từ trắng đến đen
                      '[&_[data-slot=slider-track]]:bg-gradient-to-r [&_[data-slot=slider-track]]:from-white [&_[data-slot=slider-track]]:to-black [&_[data-slot=slider-track]]:h-3',
                      // Range (đã chọn)
                      '[&_[data-slot=slider-range]]:bg-transparent [&_[data-slot=slider-range]]:h-3',
                      // Thumb (nút kéo)
                      '[&_[data-slot=slider-thumb]]:h-4 [&_[data-slot=slider-thumb]]:w-4 [&_[data-slot=slider-thumb]]:bg-[#2B3137]'
                    )}
                  />
                  <button
                    className='w-fit text-[12px] px-2 py-1 border-[1px] border-[#BCCFDC] rounded-md'
                    onDoubleClick={() => setShapeInputIsEdit('opacity', true)}
                  >
                    {shapeOpacityInput.isEditing ? (
                      <input
                        type='number'
                        min={1}
                        max={100}
                        defaultValue={+shapeOpacityInput.value}
                        onChange={(e) => setShapeInputChange('opacity', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setShapeInputIsEdit('opacity', false);
                            setShapeInputOnSubmit('opacity', e.currentTarget.value);
                          }
                        }}
                        onBlur={(e) => {
                          setShapeInputIsEdit('opacity', false);
                          setShapeInputOnSubmit('opacity', e.currentTarget.value);
                        }}
                        className='w-fit text-[12px] border-none outline-none'
                        autoFocus
                      />
                    ) : (
                      <span>{Math.round(shapeState.opacity * 100)} %</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ShapeAnnotControl;
