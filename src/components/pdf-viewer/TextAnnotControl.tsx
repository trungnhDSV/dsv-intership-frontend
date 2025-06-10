import { useTextAnnotationState } from '@/app/hooks/useAnnotText';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { COLOR_OPTIONS, FONT_FAMILY_OPTIONS, FONT_SIZE_OPTIONS } from '@/constants/UI';
import { isSameColor, rgbToString } from '@/lib/annotations/annotationStyle';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import React from 'react';

interface TextAnnotControlProps {
  textState: ReturnType<typeof useTextAnnotationState>['textState'];
  textOpacityInput: ReturnType<typeof useTextAnnotationState>['textOpacityInput'];
  textStrokeWidthInput: ReturnType<typeof useTextAnnotationState>['textStrokeWidthInput'];
  setTextInputOnSubmit: ReturnType<typeof useTextAnnotationState>['setTextInputOnSubmit'];
  setTextInputIsEdit: ReturnType<typeof useTextAnnotationState>['setTextInputIsEdit'];
  setTextInputChange: ReturnType<typeof useTextAnnotationState>['setTextInputChange'];
  setFontFamily: ReturnType<typeof useTextAnnotationState>['setFontFamily'];
  setFontSize: ReturnType<typeof useTextAnnotationState>['setFontSize'];
  setTextColor: ReturnType<typeof useTextAnnotationState>['setTextColor'];
  setTextStrokeColor: ReturnType<typeof useTextAnnotationState>['setTextStrokeColor'];
  setTextStrokeWidth: ReturnType<typeof useTextAnnotationState>['setTextStrokeWidth'];
  setTextOpacity: ReturnType<typeof useTextAnnotationState>['setTextOpacity'];
  setTextRadioGroup: ReturnType<typeof useTextAnnotationState>['setTextRadioGroup'];
  setTextFillColor: ReturnType<typeof useTextAnnotationState>['setTextFillColor'];
  forSpecificAnnot?: boolean;
  handleDeleteAnnotation?: () => void;
}

const TextAnnotControl = ({
  textState,
  textOpacityInput,
  textStrokeWidthInput,
  setTextInputOnSubmit,
  setTextInputIsEdit,
  setTextInputChange,
  setFontFamily,
  setFontSize,
  setTextColor,
  setTextStrokeColor,
  setTextStrokeWidth,
  setTextOpacity,
  setTextRadioGroup,
  setTextFillColor,
  forSpecificAnnot = false,
  handleDeleteAnnotation,
}: TextAnnotControlProps) => {
  const t = useTranslations('annotControl');
  return (
    <Popover defaultOpen={forSpecificAnnot}>
      <PopoverTrigger>
        {forSpecificAnnot ? <span /> : <ChevronDown className='w-5 h-5' />}
      </PopoverTrigger>
      <PopoverContent
        align='end'
        className='bg-[#F5F5F5] border-[1px] border-[#D9D9D9] shadow-md w-[324px] rounded-lg pt-4 overflow-hidden z-100000000'
      >
        <div>
          <div className='flex flex-col gap-4'>
            <div className='flex flex-col gap-2 px-4'>
              <p className='text-sm'>{t('textHeader')}</p>
              <div className='flex gap-2'>
                <div className='flex-1 h-[36px] rounded-md border border-[#D9D9D9] bg-white justify-center overflow-hidden'>
                  <Popover>
                    <PopoverTrigger className='p-4 flex-1 flex items-center bg-white w-full h-full'>
                      <span
                        className={cn(
                          'flex-1 text-start',
                          `font-${textState.fontFamily.replaceAll(' ', '').toLowerCase()}`
                        )}
                      >
                        {textState.fontFamily}
                      </span>
                      <ChevronDown className='w-4 h-4' />
                    </PopoverTrigger>
                    <PopoverContent
                      align='end'
                      className=' z-100000001 my-1 p-2 rounded-xl bg-white shadow-lg border-[1px] border-[#D9D9D9] w-[var(--radix-dropdown-menu-trigger-width)] min-w-full'
                      key={'fontFamily'}
                      side='bottom'
                      sideOffset={4}
                      collisionPadding={10}
                    >
                      {FONT_FAMILY_OPTIONS.map((option) => (
                        <div
                          key={option.value}
                          onClick={() => setFontFamily(option.value)}
                          className={cn(
                            'px-4 py-3 rounded-md text-sm text-start',
                            textState.fontFamily === option.value && 'bg-[#D9D9D9]',
                            `font-${option.value.replaceAll(' ', '').toLowerCase()}`
                          )}
                        >
                          {option.label}
                        </div>
                      ))}
                    </PopoverContent>
                  </Popover>
                </div>
                <div className='w-[100px] h-[36px] rounded-md border border-[#D9D9D9] bg-white justify-center overflow-hidden'>
                  <Popover>
                    <PopoverTrigger className='flex p-4 items-center bg-white w-full h-full'>
                      <span className='flex-1'>{textState.fontSize} pt</span>
                      <ChevronDown className='w-4 h-4' />
                    </PopoverTrigger>
                    <PopoverContent
                      key={'fontsize'}
                      className=' z-100000001 my-1 p-2 rounded-xl bg-white shadow-lg border-[1px] border-[#D9D9D9] w-[var(--radix-dropdown-menu-trigger-width)] min-w-full'
                    >
                      {FONT_SIZE_OPTIONS.map((option) => (
                        <div
                          key={option.value}
                          onClick={() => setFontSize(option.value)}
                          className={cn(
                            'px-4 py-3 rounded-md text-sm text-start',
                            textState.fontSize === option.value && 'bg-[#D9D9D9]'
                          )}
                        >
                          {option.label}
                        </div>
                      ))}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              {/* COLOR */}
              <div className='flex justify-between items-center'>
                {COLOR_OPTIONS.map((color) => (
                  <div
                    key={color.label}
                    onClick={() => setTextColor(color.value)}
                    className={cn(
                      'w-[30px] h-[30px] p-1 rounded-full flex items-center justify-center',
                      isSameColor(color.value, textState.textColor) && 'ring-1 ring-[#161C21]'
                    )}
                  >
                    <div
                      className='w-6 h-6 rounded-full ring-1 ring-[#D9D9D9]'
                      style={{ backgroundColor: rgbToString(color.value) }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className={cn('flex flex-col gap-4 px-4', !forSpecificAnnot && 'pb-4')}>
              <div className='flex flex-col gap-2'>
                <p className='text-sm'>{t('frameStyle')}</p>
                {/* radio group */}
                <div className='w-full flex bg-white rounded-full'>
                  <button
                    className={cn(
                      'flex-1 py-2 text-center rounded-full text-sm font-semibold text-[#757575]',
                      textState.radioGroup === 'fill' && 'bg-[#D9D9D9] text-[#012832]'
                    )}
                    onClick={() => setTextRadioGroup('fill')}
                  >
                    {t('fill')}
                  </button>
                  <button
                    className={cn(
                      'flex-1 py-2 text-center rounded-full text-sm font-semibold text-[#757575]',
                      textState.radioGroup === 'borderLine' && 'bg-[#D9D9D9] text-[#012832]'
                    )}
                    onClick={() => setTextRadioGroup('borderLine')}
                  >
                    {t('borderLine')}
                  </button>
                </div>

                {/* COLOR */}
                <div className='flex justify-between items-center'>
                  <div
                    className={cn(
                      'w-[30px] h-[30px] p-1 rounded-full flex items-center justify-center',
                      (textState.radioGroup === 'borderLine'
                        ? !textState.strokeColor
                        : !textState.fillColor) && 'ring-1 ring-[#161C21]'
                    )}
                    key={'colorNone'}
                    onClick={() =>
                      textState.radioGroup === 'borderLine'
                        ? setTextStrokeColor(null)
                        : setTextFillColor(null)
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
                  {COLOR_OPTIONS.map((color) => (
                    <div
                      key={color.label}
                      onClick={() =>
                        textState.radioGroup === 'borderLine'
                          ? setTextStrokeColor(color.value)
                          : setTextFillColor(color.value)
                      }
                      className={cn(
                        'w-[30px] h-[30px] p-1 rounded-full flex items-center justify-center',
                        isSameColor(
                          color.value,
                          textState.radioGroup === 'borderLine'
                            ? textState.strokeColor
                            : textState.fillColor
                        ) && 'ring-1 ring-[#161C21]'
                      )}
                    >
                      <div
                        className='w-6 h-6 rounded-full ring-1 ring-[#D9D9D9]'
                        style={{ backgroundColor: rgbToString(color.value) }}
                      />
                    </div>
                  ))}
                </div>
                {textState.radioGroup === 'borderLine' && (
                  <div className='flex items-center gap-4'>
                    <Image
                      src='/icons/md_stroke.png'
                      className='w-6 h-6'
                      alt='stroke'
                      width={24}
                      height={24}
                    />
                    <Slider
                      value={[textState.strokeWidth]}
                      onValueChange={(value) => {
                        setTextStrokeWidth(value[0]);
                        setTextInputChange('strokeWidth', value[0].toString());
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
                    <button
                      className='w-fit text-[12px] px-2 py-1 border-[1px] border-[#BCCFDC] rounded-md'
                      onDoubleClick={() => setTextInputIsEdit('strokeWidth', true)}
                    >
                      {textStrokeWidthInput.isEditing ? (
                        <input
                          type='number'
                          min={1}
                          max={50}
                          value={textStrokeWidthInput.value}
                          onChange={(e) => setTextInputChange('strokeWidth', e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setTextInputIsEdit('strokeWidth', false);
                              setTextInputOnSubmit('strokeWidth', e.currentTarget.value);
                            }
                          }}
                          onBlur={(e) => {
                            setTextInputIsEdit('strokeWidth', false);
                            setTextInputOnSubmit('strokeWidth', e.currentTarget.value);
                          }}
                          className='w-fit text-[12px] border-none outline-none'
                          autoFocus
                        />
                      ) : (
                        `${textState.strokeWidth} pt`
                      )}
                    </button>
                  </div>
                )}
              </div>
              <div className='flex flex-col gap-2'>
                <p className='text-sm'>{t('opacity')}</p>
                <div className='flex items-center gap-4'>
                  <Slider
                    value={[Math.round(textState.opacity * 100)]}
                    onValueChange={(value) => {
                      setTextOpacity(value[0] / 100);
                      setTextInputChange('opacity', value[0].toString());
                    }}
                    max={100}
                    step={1}
                    className={cn(
                      'flex-1 h-1',
                      // Track: gradient từ trắng đến đen
                      '[&_[data-slot=slider-track]]:bg-gradient-to-r [&_[data-slot=slider-track]]:from-white [&_[data-slot=slider-track]]:to-black/80 [&_[data-slot=slider-track]]:h-3',
                      // Range (đã chọn)
                      '[&_[data-slot=slider-range]]:bg-transparent [&_[data-slot=slider-range]]:h-3',
                      // Thumb (nút kéo)
                      '[&_[data-slot=slider-thumb]]:h-4 [&_[data-slot=slider-thumb]]:w-4 [&_[data-slot=slider-thumb]]:bg-[#2B3137]'
                    )}
                  />
                  <button
                    className='w-fit text-[12px] px-2 py-1 border-[1px] border-[#BCCFDC] rounded-md'
                    onDoubleClick={() => setTextInputIsEdit('opacity', true)}
                  >
                    {textOpacityInput.isEditing ? (
                      <input
                        type='number'
                        min={1}
                        max={100}
                        value={textOpacityInput.value}
                        onChange={(e) => setTextInputChange('opacity', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setTextInputIsEdit('opacity', false);
                            setTextInputOnSubmit('opacity', e.currentTarget.value);
                          }
                        }}
                        onBlur={(e) => {
                          setTextInputIsEdit('opacity', false);
                          setTextInputOnSubmit('opacity', e.currentTarget.value);
                        }}
                        className='w-fit text-[12px] border-none outline-none'
                        autoFocus
                      />
                    ) : (
                      <span>{Math.round(textState.opacity * 100)} %</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
            {forSpecificAnnot && (
              <div>
                <button
                  onClick={handleDeleteAnnotation}
                  className='flex items-center gap-2 px-4 bg-white w-full'
                >
                  <Image src='/icons/md_trash-bin.svg' alt='delete' width={16} height={16} />
                  <p className='text-[#900B09] py-[12px]'>{t('delete')}</p>
                </button>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TextAnnotControl;
