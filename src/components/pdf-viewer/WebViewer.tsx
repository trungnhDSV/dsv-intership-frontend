'use client';
import PaginantionControl from '@/components/pdf-viewer/PaginantionControl';
import { ZoomControls } from '@/components/pdf-viewer/ZoomControl';
import { Core, WebViewerInstance } from '@pdftron/webviewer';
import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';
import TextAnnotControl from './TextAnnotControl';
import ShapeAnnotControl from './ShapeAnnotControl';
import { cn } from '@/lib/utils';
import { useTextAnnotationState } from '@/app/hooks/useAnnotText';
import { useShapeAnnotationState } from '@/app/hooks/useAnnotShape';
import { ShapeType } from '@/types/types';

interface WebViewerProps {
  initialDoc: string;
}

export default function WebViewer({ initialDoc }: WebViewerProps) {
  const viewer = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<WebViewerInstance | null>(null);
  const [isViewerReady, setIsViewerReady] = useState(false);

  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isEditingPage, setIsEditingPage] = useState<boolean>(false);
  const [pageInput, setPageInput] = useState<string>('1');
  const [zoom, setZoom] = useState(1);

  // ANNOTATION
  const [selectedAnnotation, setSelectedAnnotation] = useState<'shape' | 'text' | null>(null);
  const {
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
    // setText,
    // resetText,
  } = useTextAnnotationState();

  const {
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
    // resetShape,
  } = useShapeAnnotationState();

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
              'contextMenuPopup', // Ẩn menu ngữ cảnh
              'textPopup', // Ẩn popup văn bản
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
          setZoom(zoom);
        });
        documentViewer.addEventListener('zoomUpdated', (zoomLevel) => {
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

  // Register custom annotation tools
  useEffect(() => {
    const init = async () => {
      const { registerTriangleAnnotation } = await import('@/lib/annotations/TriangleTool');
      if (instanceRef.current) {
        registerTriangleAnnotation(instanceRef.current);
      }
    };
    if (isViewerReady) {
      init();
    }
  }, [isViewerReady]);

  const handleSetZoom = (newZoom: number) => {
    if (instanceRef.current) {
      instanceRef.current.Core.documentViewer.zoomTo(newZoom);
      setZoom(newZoom);
    }
  };
  function getToolNameFromShapeType(shapeType: ShapeType) {
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

  // Update tool mode when selected annotation changes
  useEffect(() => {
    if (instanceRef.current) {
      if (selectedAnnotation === 'shape') {
        const toolName = getToolNameFromShapeType(shapeState.shapeType);
        instanceRef.current.UI.setToolMode(toolName);
        // Core.annotationDefaults
      } else if (selectedAnnotation === 'text') {
        console.log('TEXT ANNOTATION SELECTED');
        instanceRef.current.UI.setToolMode('AnnotationCreateFreeText');
      } else {
        // instanceRef.current.UI.setToolMode('Pan');
        instanceRef.current.UI.setToolMode('AnnotationEdit');
      }
    }
  }, [instanceRef, selectedAnnotation, shapeState.shapeType]);

  // Handle annotation added event for shape annotations
  useEffect(() => {
    if (!instanceRef.current || !isViewerReady || selectedAnnotation !== 'shape') return;

    const { Core } = instanceRef.current;
    const toolName = getToolNameFromShapeType(shapeState.shapeType);
    const tool = Core.documentViewer.getTool(toolName);

    console.log('Current tool:', tool);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onAnnotAdded = (annot: typeof Core.Annotations.Annotation | any) => {
      const { Annotations } = Core;

      const isBuiltInShape =
        annot instanceof Annotations.RectangleAnnotation ||
        annot instanceof Annotations.EllipseAnnotation ||
        annot instanceof Annotations.LineAnnotation;

      const isTriangleShape = annot.Subject === 'Triangle' && annot.elementName === 'triangle';

      if (isBuiltInShape || isTriangleShape) {
        console.log('Shape annotation added:', annot);
        // Stroke
        if (shapeState.strokeColor) {
          annot.StrokeColor = new Annotations.Color(
            shapeState.strokeColor.r,
            shapeState.strokeColor.g,
            shapeState.strokeColor.b
          );
        }

        // Fill
        if ('FillColor' in annot && shapeState.fillColor) {
          annot.FillColor = new Annotations.Color(
            shapeState.fillColor.r,
            shapeState.fillColor.g,
            shapeState.fillColor.b
          );
        } else if ('FillColor' in annot) {
          annot.FillColor = new Annotations.Color(255, 255, 255, 0);
        }

        // Opacity, thickness
        annot.StrokeThickness = shapeState.strokeWidth;
        annot.Opacity = shapeState.opacity;

        Core.documentViewer.getAnnotationManager().redrawAnnotation(annot);
      }
    };

    tool.addEventListener('annotationAdded', onAnnotAdded);

    return () => {
      tool.removeEventListener('annotationAdded', onAnnotAdded);
    };
  }, [shapeState, selectedAnnotation, isViewerReady, instanceRef.current]);

  // Handle annotation added event for text annotations
  useEffect(() => {
    if (!instanceRef.current || !isViewerReady || selectedAnnotation !== 'text') return;

    const { Core } = instanceRef.current;
    const tool = Core.documentViewer.getTool('AnnotationCreateFreeText');

    const onAnnotAdded = (annot: Core.Annotations.Annotation) => {
      const { Annotations } = Core;
      console.log('Text annotation added:', annot, annot instanceof Annotations.FreeTextAnnotation);

      if (annot instanceof Annotations.FreeTextAnnotation) {
        // Padding
        // annot.setPadding(new Core.Math.Rect(4, 4, 4, 4));

        // Font settings
        annot.FontSize = textState.fontSize.toString();

        // annot.setFont(textState.fontFamily);

        // Text color
        if (textState.textColor) {
          annot.TextColor = new Annotations.Color(
            textState.textColor.r,
            textState.textColor.g,
            textState.textColor.b
          );
        }

        // Stroke
        annot.StrokeThickness = textState.strokeWidth;
        if (textState.strokeColor) {
          annot.StrokeColor = new Annotations.Color(
            textState.strokeColor.r,
            textState.strokeColor.g,
            textState.strokeColor.b
          );
        }

        // Opacity
        annot.Opacity = textState.opacity;

        // Redraw
        Core.documentViewer.getAnnotationManager().redrawAnnotation(annot);
      }
    };

    tool.addEventListener('annotationAdded', onAnnotAdded);

    return () => {
      tool.removeEventListener('annotationAdded', onAnnotAdded);
    };
  }, [textState, selectedAnnotation, isViewerReady]);

  useEffect(() => {
    if (!instanceRef.current || !isViewerReady) return;

    const { Core } = instanceRef.current;
    const annotManager = Core.documentViewer.getAnnotationManager();

    const handleAnnotAdded = (annotations: Core.Annotations.Annotation[], action: string) => {
      if (action !== 'add') return;

      annotations.forEach((annot) => {
        if (annot instanceof Core.Annotations.FreeTextAnnotation && selectedAnnotation === 'text') {
          annot.Font = textState.fontFamily;
          annot.FontSize = textState.fontSize.toString();
          if (textState.textColor) {
            annot.TextColor = new Core.Annotations.Color(
              textState.textColor.r,
              textState.textColor.g,
              textState.textColor.b
            );
          }
          annot.StrokeThickness = textState.strokeWidth;
          if (textState.strokeColor) {
            annot.StrokeColor = new Core.Annotations.Color(
              textState.strokeColor.r,
              textState.strokeColor.g,
              textState.strokeColor.b
            );
          }
          annot.Opacity = textState.opacity;
        }

        // if (selectedAnnotation === 'shape') {
        //   annot.StrokeThickness = shapeState.strokeWidth;
        //   annot.StrokeColor = new Core.Annotations.Color(
        //     shapeState.strokeColor.r,
        //     shapeState.strokeColor.g,
        //     shapeState.strokeColor.b
        //   );
        //   if ('FillColor' in annot && shapeState.fillColor) {
        //     annot.FillColor = new Core.Annotations.Color(
        //       shapeState.fillColor.r,
        //       shapeState.fillColor.g,
        //       shapeState.fillColor.b
        //     );
        //   }
        //   annot.Opacity = shapeState.opacity;
        // }

        annotManager.redrawAnnotation(annot);
      });
    };

    annotManager.addEventListener('annotationChanged', handleAnnotAdded);

    return () => {
      annotManager.removeEventListener('annotationChanged', handleAnnotAdded);
    };
  }, [selectedAnnotation, textState, shapeState, isViewerReady]);

  useEffect(() => {
    if (!instanceRef.current || !isViewerReady || selectedAnnotation !== 'text') return;

    const { Core } = instanceRef.current;
    const annotManager = Core.documentViewer.getAnnotationManager();
    const { Annotations } = Core;

    const handleFreeTextStyle = (annots: Core.Annotations.Annotation[], action: string) => {
      if (action !== 'add') return;

      annots.forEach((annot) => {
        if (annot instanceof Annotations.FreeTextAnnotation) {
          // Chờ textarea mount rồi chỉnh style trực tiếp
          setTimeout(() => {
            const textarea = document.querySelector(
              'textarea.freeTextTextarea'
            ) as HTMLTextAreaElement;
            if (textarea) {
              textarea.style.fontSize = `${textState.fontSize}px`;
              textarea.style.fontFamily = textState.fontFamily;
              textarea.style.color = `rgb(${textState.textColor.r}, ${textState.textColor.g}, ${textState.textColor.b})`;
            }
          }, 0);
        }
      });
    };

    annotManager.addEventListener('annotationChanged', handleFreeTextStyle);

    return () => {
      annotManager.removeEventListener('annotationChanged', handleFreeTextStyle);
    };
  }, [instanceRef, isViewerReady, selectedAnnotation, textState]);

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
      <div className='absolute bottom-[92px] right-[49px] z-10 flex items-center bg-white py-[6px] px-2 rounded-lg shadow-md justify-center gap-1'>
        {/* SHAPE ANNOTATION */}
        <div className='flex'>
          <button
            className={cn(
              'flex gap-1 items-center text-sm h-[30px]  rounded-sm p-1',
              selectedAnnotation === 'shape' && 'bg-[#D9D9D9]'
            )}
            onClick={() => {
              if (selectedAnnotation === 'shape') {
                setSelectedAnnotation(null);
              } else {
                setSelectedAnnotation('shape');
              }
            }}
          >
            <Image src='/icons/md_rectangle.svg' alt='rectangle' width={24} height={24} />
            <span>Shape</span>
          </button>
          <ShapeAnnotControl
            shapeState={shapeState}
            shapeOpacityInput={shapeOpacityInput}
            shapeStrokeWidthInput={shapeStrokeWidthInput}
            setShapeInputOnSubmit={setShapeInputOnSubmit}
            setShapeInputIsEdit={setShapeInputIsEdit}
            setShapeInputChange={setShapeInputChange}
            setShapeType={setShapeType}
            setShapeStrokeColor={setShapeStrokeColor}
            setShapeStrokeWidth={setShapeStrokeWidth}
            setShapeFillColor={setShapeFillColor}
            setShapeOpacity={setShapeOpacity}
            setShapeRadioGroup={setShapeRadioGroup}
          />
        </div>

        <div className='w-[1px] h-[18px] bg-[#DBDDE1]'></div>

        {/* TYPE ANNOTATION */}
        <div className='flex'>
          <button
            className={cn(
              'flex gap-1 items-center text-sm h-[30px]  rounded-sm p-1',
              selectedAnnotation === 'text' && 'bg-[#D9D9D9]'
            )}
            onClick={() => {
              if (selectedAnnotation === 'text') {
                setSelectedAnnotation(null);
              } else {
                setSelectedAnnotation('text');
              }
            }}
          >
            <Image src='/icons/lm-tool-type.svg' alt='rectangle' width={24} height={24} />
            <span>Type</span>
          </button>
          <TextAnnotControl
            textState={textState}
            textOpacityInput={textOpacityInput}
            textStrokeWidthInput={textStrokeWidthInput}
            setTextInputOnSubmit={setTextInputOnSubmit}
            setTextInputIsEdit={setTextInputIsEdit}
            setTextInputChange={setTextInputChange}
            setFontFamily={setFontFamily}
            setFontSize={setFontSize}
            setTextColor={setTextColor}
            setTextStrokeColor={setTextStrokeColor}
            setTextStrokeWidth={setTextStrokeWidth}
            setTextOpacity={setTextOpacity}
            setTextRadioGroup={setTextRadioGroup}
          />
        </div>
      </div>
    </div>
  );
}
