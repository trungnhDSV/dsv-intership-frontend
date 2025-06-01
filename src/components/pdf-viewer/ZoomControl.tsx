import { Button } from '@/components/ui/button';
import React from 'react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu';
import { ChevronDown, ChevronUp, CircleMinus, CirclePlus } from 'lucide-react';
import { useEffect, useState } from 'react';

const ZOOM_STEP = 0.25;
const MIN_ZOOM = 0.5;
const ZOOM_OPTIONS = [50, 75, 90, 100, 125, 150, 200];
const MAX_ZOOM = 2;

export const ZoomControls = ({
  zoom,
  setZoom,
  isViewerReady,
}: {
  zoom: number;
  setZoom: (zoom: number) => void;
  isViewerReady: boolean;
}) => {
  const [isEditingZoom, setIsEditingZoom] = useState(false);
  const [zoomInput, setZoomInput] = useState(String(Math.round(zoom * 100)));
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Sync zoom input with zoom value
  useEffect(() => {
    setZoomInput(String(Math.round(zoom * 100)));
  }, [zoom]);

  // Handle zoom input submission
  const submitZoomInput = () => {
    const numericValue = parseInt(zoomInput);
    if (!isNaN(numericValue)) {
      const clampedValue = Math.max(MIN_ZOOM * 100, Math.min(MAX_ZOOM * 100, numericValue));
      setZoom(clampedValue / 100);
    }
    setIsEditingZoom(false);
  };

  // Keyboard handling for zoom input
  const handleZoomInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      submitZoomInput();
    } else if (e.key === 'Escape') {
      setIsEditingZoom(false);
      setZoomInput(String(Math.round(zoom * 100)));
    }
  };

  // Zoom functions with center preservation
  const zoomIn = () => {
    const newZoom = Math.min(zoom + ZOOM_STEP, MAX_ZOOM);
    setZoom(newZoom);
  };

  const zoomOut = () => {
    const newZoom = Math.max(zoom - ZOOM_STEP, MIN_ZOOM);
    setZoom(newZoom);
  };

  return (
    <div className='flex items-center gap-1'>
      <Button
        variant='ghost'
        onClick={zoomOut}
        disabled={zoom <= MIN_ZOOM || !isViewerReady}
        className='p-2'
        aria-label='Zoom out'
      >
        <CircleMinus className='h-4 w-4' />
      </Button>

      <div
        className={cn(
          'flex items-center border rounded-md overflow-hidden',
          dropdownOpen && 'border-[#FFCF33]'
        )}
      >
        {/* Zoom percentage display/input */}
        <Button
          variant='ghost'
          className='w-16 border-r-none rounded-none p-0'
          onDoubleClick={() => {
            if (!isViewerReady) return;
            setIsEditingZoom(true);
          }}
        >
          {isEditingZoom ? (
            <input
              type='number'
              min={MIN_ZOOM * 100}
              max={MAX_ZOOM * 100}
              value={zoomInput}
              onChange={(e) => setZoomInput(e.target.value)}
              onKeyDown={handleZoomInputKeyDown}
              onBlur={submitZoomInput}
              className='w-full bg-transparent text-center outline-none'
              autoFocus
            />
          ) : (
            `${Math.round(zoom * 100)}%`
          )}
        </Button>

        {/* Dropdown trigger */}
        <DropdownMenu onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              className='px-2 rounded-none'
              disabled={isEditingZoom || !isViewerReady}
            >
              {dropdownOpen ? (
                <ChevronUp className='h-4 w-4' />
              ) : (
                <ChevronDown className='h-4 w-4' />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align='end'
            sideOffset={5}
            className='w-[100px] p-2 rounded-xl bg-white shadow-lg border border-gray-200'
          >
            {ZOOM_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option}
                onClick={() => setZoom(option / 100)}
                className={cn(
                  'px-4 py-2 rounded-md text-sm',
                  zoom * 100 === option && 'bg-gray-100 font-medium'
                )}
              >
                {option}%
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Button
        variant='ghost'
        onClick={zoomIn}
        disabled={zoom >= MAX_ZOOM || !isViewerReady}
        className='p-2'
        aria-label='Zoom in'
      >
        <CirclePlus className='h-4 w-4' />
      </Button>
    </div>
  );
};
