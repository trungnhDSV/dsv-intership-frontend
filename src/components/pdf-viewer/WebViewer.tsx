'use client';

import PaginantionControl from '@/components/pdf-viewer/PaginantionControl';
import { ZoomControls } from '@/components/pdf-viewer/ZoomControl';
import { cn } from '@/lib/utils';
import { WebViewerInstance } from '@pdftron/webviewer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu';
import { Ban, ChevronDown, RectangleHorizontal, Type } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface WebViewerProps {
  initialDoc: string;
}

const FONT_FAMILY_OPTIONS = [
  { label: 'Inter', value: 'Inter' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Times New Roman', value: 'Times New Roman' },
];
const FONT_SIZE_OPTIONS = [
  { label: '8pt', value: 8 },
  { label: '10pt', value: 10 },
  { label: '12pt', value: 12 },
  { label: '14pt', value: 14 },
  { label: '16pt', value: 16 },
  { label: '18pt', value: 18 },
  { label: '20pt', value: 20 },
];
const COLOR_OPTIONS = [
  { label: 'Red', value: '#FF0000' },
  { label: 'Green', value: '#00FF00' },
  { label: 'Blue', value: '#0000FF' },
  { label: 'Black', value: '#000000' },
  { label: 'White', value: '#FFFFFF' },
];

export default function WebViewer({ initialDoc }: WebViewerProps) {
  const viewer = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<WebViewerInstance | null>(null);
  const [isViewerReady, setIsViewerReady] = useState(false);

  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isEditingPage, setIsEditingPage] = useState<boolean>(false);
  const [pageInput, setPageInput] = useState<string>('1');
  const [zoom, setZoom] = useState(1);
  const [RadioGroupValue, setRadioGroupValue] = React.useState('fill');

  useEffect(() => {
    let webViewerInstance: WebViewerInstance;
    const initializeWebViewer = async () => {
      try {
        if (!viewer.current || !initialDoc) return;

        const { default: WebViewer } = await import('@pdftron/webviewer');

        webViewerInstance = await WebViewer(
          {
            path: '/lib/webviewer',
            licenseKey: process.env.NEXT_PUBLIC_PDFTRON_LICENSE_KEY,
            initialDoc: initialDoc,
            disabledElements: [
              'header', // Ẩn header mặc định
              'toolsHeader', // Ẩn thanh công cụ
              'leftPanel', // Ẩn panel trái
              'searchOverlay', // Ẩn tìm kiếm
              'tools-header',
              'default-top-header',
              'printButton',
              'downloadButton',
              'pageNavOverlay', // Ẩn điều hướng trang
              'annotationPopup', // Ẩn popup chú thích
              'pageControls',
              'page-nav-floating-header', // pagination controls
            ],
          },
          viewer.current
        );

        webViewerInstance.UI.setLayoutMode(webViewerInstance.UI.LayoutMode.Single);
        webViewerInstance.UI.setFitMode(webViewerInstance.UI.FitMode.FitPage);

        // Store instance
        instanceRef.current = webViewerInstance;

        // Annotation setup
        const { documentViewer, Annotations } = webViewerInstance.Core;
        const annotManager = documentViewer.getAnnotationManager();

        documentViewer.addEventListener('documentLoaded', () => {
          setIsViewerReady(true);

          // Disable page navigation features
          webViewerInstance.UI.disableFeatures([webViewerInstance.UI.Feature.PageNavigation]);

          //   init for pagination
          const docViewer = webViewerInstance.Core.documentViewer;
          const pageCount = docViewer.getPageCount();
          setNumPages(pageCount);
          setCurrentPage(docViewer.getCurrentPage());

          // init for zoom feature
          const zoom = docViewer.getZoomLevel();
          console.log('Initial zoom level:', zoom);
          setZoom(zoom);
        });
        documentViewer.addEventListener('zoomUpdated', (zoomLevel) => {
          //   if (zoomLevel < 0.5) {
          //     zoomLevel = 0.5;
          //   } else if (zoomLevel > 2.5) {
          //     zoomLevel = 2.5;
          //   }
          //   webViewerInstance.Core.documentViewer.zoomTo(zoomLevel);
          console.log('Zoom level changed:', zoomLevel);
          setZoom(zoomLevel);
        });

        documentViewer.addEventListener('loadError', (error) => {
          console.error('PDF load error:', error);
        });
      } catch (error) {
        console.error('Error initializing WebViewer:', error);
      }
    };

    initializeWebViewer();
  }, [viewer, initialDoc]);

  const handleSetZoom = (newZoom: number) => {
    if (instanceRef.current) {
      instanceRef.current.Core.documentViewer.zoomTo(newZoom);
      setZoom(newZoom);
    }
  };

  return (
    <div className='flex-1 flex flex-col rounded-2xl overflow-hidden border-[1px] border-[#D9D9D9]'>
      <div className='flex-1 overflow-hidden'>
        <div className='webviewer' ref={viewer} style={{ height: '100%' }}></div>
      </div>

      {/* Controls Bar */}
      <div className='flex items-center justify-center py-3 px-2 gap-2 bg-white border-t border-[#D9D9D9] h-fit'>
        {/* Zoom Controls */}
        <ZoomControls zoom={zoom} setZoom={handleSetZoom} />

        {/* Page Navigation */}
        <PaginantionControl
          instanceRef={instanceRef}
          numPages={numPages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          isEditingPage={isEditingPage}
          setIsEditingPage={setIsEditingPage}
          pageInput={pageInput}
          setPageInput={setPageInput}
        />
      </div>

      {/* Annotation Control */}
      <div className='absolute bottom-0 right-0  z-10 flex items-center bg-white py-[6px] px-2 rounded-lg shadow-md justify-center gap-1'>
        <div className='flex'>
          <div className='flex gap-1 items-center text-sm h-[30px] bg-[#D9D9D9] rounded-sm p-1'>
            <RectangleHorizontal className='w-5 h-5' />
            <span>Shape</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <ChevronDown className='w-5 h-5' />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuItem>Team</DropdownMenuItem>
              <DropdownMenuItem>Subscription</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className='w-[1px] h-[18px] bg-[#DBDDE1]'></div>
        <div className='flex'>
          <div className='flex gap-1 items-center text-sm h-[30px] bg-[#D9D9D9] rounded-sm p-1'>
            <Type className='w-5 h-5' />
            <span>Type</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <ChevronDown className='w-5 h-5' />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='end'
              className='bg-[#F5F5F5] border-[1px] border-[#D9D9D9] shadow-md w-[324px] rounded-lg p-4'
            >
              <DropdownMenuItem>
                <div className='flex flex-col gap-4'>
                  <div className='flex flex-col gap-2'>
                    <p>Text style</p>
                    <div className='flex gap-2'>
                      <div className='flex-1 p-4 h-[36px] rounded-md border border-[#D9D9D9] bg-white justify-center'>
                        <DropdownMenu>
                          <DropdownMenuTrigger className='flex items-center bg-white w-full h-full'>
                            <span className='flex-1'>Inter</span>
                            <ChevronDown className='w-4 h-4' />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align='end'
                            className='w-fit text-center p-2 mb-3 rounded-xl bg-white/80 shadow-lg border border-gray-200'
                          >
                            {FONT_FAMILY_OPTIONS.map((option) => (
                              <DropdownMenuItem
                                key={option.value}
                                // onClick={() => handleStyleChange('fontSize', option.value)}
                                className='px-2 py-1 rounded-md text-sm'
                              >
                                {option.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className='w-[100px] p-4 h-[36px] rounded-md border border-[#D9D9D9] bg-white justify-center'>
                        <DropdownMenu>
                          <DropdownMenuTrigger className='flex items-center bg-white w-full h-full'>
                            <span className='flex-1'>12pt</span>
                            <ChevronDown className='w-4 h-4' />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className='w-fit text-center p-2 mb-3 rounded-xl bg-white/80 shadow-lg border border-gray-200'>
                            {FONT_SIZE_OPTIONS.map((option) => (
                              <DropdownMenuItem
                                key={option.value}
                                // onClick={() => handleStyleChange('fontSize', option.value)}
                                className='px-2 py-1 rounded-md text-sm'
                              >
                                {option.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    {/* COLOR */}
                    <div className='flex justify-between items-center'>
                      {COLOR_OPTIONS.map((color) => (
                        <div
                          key={color.value}
                          className='w-[30px] h-[30px] rounded-full flex items-center justify-center ring-2'
                          style={{ boxShadow: `0 0 0 2px ${color.value}` }}
                        >
                          <div
                            className='w-6 h-6 rounded-full'
                            style={{ backgroundColor: color.value }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className='flex flex-col gap-2'>
                    <p>Frame style</p>
                    {/* radio group */}
                    <div className='w-full flex bg-white rounded-full'>
                      <button
                        className={cn(
                          'flex-1 py-2 text-center rounded-full',
                          RadioGroupValue === 'fill' && 'bg-[#D9D9D9]'
                        )}
                        onClick={() => setRadioGroupValue('fill')}
                      >
                        Fill
                      </button>
                      <button
                        className={cn(
                          'flex-1 py-2 text-center rounded-full',
                          RadioGroupValue === 'stroke' && 'bg-[#D9D9D9]'
                        )}
                        onClick={() => setRadioGroupValue('stroke')}
                      >
                        Border Line
                      </button>
                    </div>

                    {RadioGroupValue === 'stroke' && <div></div>}

                    {/* COLOR */}
                    <div className='flex justify-between items-center'>
                      <div
                        className='w-[30px] h-[30px] rounded-full flex items-center justify-center ring-2'
                        key={'colorNone'}
                      >
                        <Ban className='w-6 h-6' />
                      </div>
                      {COLOR_OPTIONS.map((color) => (
                        <div
                          className='w-[30px] h-[30px] rounded-full flex items-center justify-center ring-2'
                          style={{ boxShadow: `0 0 0 2px ${color.value}` }}
                        >
                          <div
                            className='w-6 h-6 rounded-full'
                            style={{ backgroundColor: color.value }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
