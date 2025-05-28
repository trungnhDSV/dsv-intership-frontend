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
import { toHex } from '@/lib/annotations/annotationStyle';
import { Button } from '@/components/ui/button';
import { set } from 'zod';

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
    setTextFillColor,
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

  const [popupData, setPopupData] = useState<{
    visible: boolean;
    x: number;
    y: number;
    annotation: Core.Annotations.Annotation | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    annotation: null,
  });

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
              'pageControls',
              'page-nav-floating-header', // pagination controls
              'contextMenuPopup', // Ẩn menu ngữ cảnh
              'textPopup', // Ẩn popup văn bản
              'annotationPopup', // Ẩn popup chú thích
              'annotationCommentButton',
              'annotationStyleEditButton',
              'linkButton',
              'annotationDeleteButton',
            ],
          },
          viewer.current
        );

        webViewerInstance.UI.setLayoutMode(webViewerInstance.UI.LayoutMode.Single);
        webViewerInstance.UI.setFitMode(webViewerInstance.UI.FitMode.FitPage);

        // Store instance
        instanceRef.current = webViewerInstance;

        // Annotation setup
        const { documentViewer } = webViewerInstance.Core;
        const annotManager = documentViewer.getAnnotationManager();

        documentViewer.addEventListener('documentLoaded', () => {
          // Disable page navigation features
          webViewerInstance.UI.disableFeatures([webViewerInstance.UI.Feature.PageNavigation]);
          instanceRef.current?.UI.disableElements(['annotationPopup']);
          //   init for pagination
          const docViewer = webViewerInstance.Core.documentViewer;
          const pageCount = docViewer.getPageCount();
          setNumPages(pageCount);
          setCurrentPage(docViewer.getCurrentPage());

          // init for zoom feature
          const zoom = docViewer.getZoomLevel();
          setZoom(zoom);

          setIsViewerReady(true);

          // annotManager.addEventListener(
          //   'annotationSelected',
          //   async (annots: Core.Annotations.FreeTextAnnotation[]) => {
          //     try {
          //       if (annots.length === 0) {
          //         setPopupData({ visible: false, x: 0, y: 0, annotation: null });
          //         return;
          //       }

          //       const annot = annots[0];
          //       const displayViewer = webViewerInstance.Core.documentViewer;

          //       const annotRect = annot.getRect(); // PDF Coordinates, x1, y1: Top left ,x2, y2: Bottom right
          //       if (!annotRect) {
          //         console.warn('Annotation has no valid rectangle');
          //         return;
          //       }

          //       const centerX = (annotRect.x1 + annotRect.x2) / 2;
          //       const bottomY = annotRect.y2;

          //       // Lấy tọa độ màn hình (đã bao gồm zoom)
          //       const windowCoords = displayViewer
          //         .getDocument()
          //         .getViewerCoordinates(annot.PageNumber, centerX, bottomY);

          //       // Tính toán scroll (nếu có)
          //       const scrollEl = displayViewer.getScrollViewElement();
          //       const scrollLeft = scrollEl?.scrollLeft || 0;
          //       const scrollTop = scrollEl?.scrollTop || 0;

          //       const viewerRect = scrollEl?.getBoundingClientRect();

          //       const viewerHeight = viewerRect ? viewerRect.height : 0;
          //       const correctedY = viewerHeight
          //         ? viewerHeight - (windowCoords.y - scrollTop)
          //         : windowCoords.y - scrollTop;

          //       // Debug: Log tất cả thông số
          //       console.log('Position debug:', {
          //         windowCoords,
          //         scroll: { scrollLeft, scrollTop },
          //         zoom: displayViewer.getZoomLevel(),
          //         annotRect,
          //       });

          //       setPopupData({
          //         visible: true,
          //         x: windowCoords.x - scrollLeft,
          //         y: correctedY + 8,
          //         annotation: annot,
          //       });
          //     } catch (error) {
          //       console.error('Annotation position error:', error);
          //       setPopupData({ visible: false, x: 0, y: 0, annotation: null });
          //     }
          //   }
          // );
          annotManager.addEventListener('annotationSelected', function (annotations) {
            if (annotations.length > 0) {
              const annot = annotations[0];
              // setSelectedAnnot(annot);

              const doc = webViewerInstance.Core.documentViewer.getDocument();
              const { x1, y1, x2, y2 } = annot.getRect();
              const pageNumber = annot.PageNumber || annot.getPageNumber();
              const bottomCenterX = (x1 + x2) / 2;
              const bottomCenterY = y2;
              const pos = doc.getViewerCoordinates(pageNumber, bottomCenterX, bottomCenterY);

              // setDeleteBtnPos({
              //   left: pos.x,
              //   top: pos.y + 5, // dịch xuống 5px cho dễ bấm
              // });
              setPopupData({
                visible: true,
                x: pos.x,
                y: pos.y + 8, // dịch xuống 8px cho dễ bấm
                annotation: annot,
              });
              console.log('Annotation position:', pos);
            } else {
              // setDeleteBtnPos(null);
              // setSelectedAnnot(null);
            }
          });
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
    if (instanceRef.current && isViewerReady) {
      if (selectedAnnotation === 'shape') {
        const { documentViewer, Annotations } = instanceRef.current.Core;
        const toolName = getToolNameFromShapeType(shapeState.shapeType);
        documentViewer.getTool(toolName).setStyles({
          StrokeThickness: shapeState.strokeWidth,
          StrokeColor: new Annotations.Color(
            shapeState.strokeColor?.r ?? 0,
            shapeState.strokeColor?.g ?? 0,
            shapeState.strokeColor?.b ?? 0
          ),
          FillColor: new Annotations.Color(
            shapeState.fillColor?.r ?? 255,
            shapeState.fillColor?.g ?? 255,
            shapeState.fillColor?.b ?? 255,
            shapeState.fillColor ? 1 : 0 // Set alpha to 1 if fill color is set, otherwise 0
          ),
          Opacity: shapeState.opacity,
        });

        instanceRef.current.UI.setToolMode(toolName);
        // Core.annotationDefaults
      } else if (selectedAnnotation === 'text') {
        const { documentViewer, Annotations } = instanceRef.current.Core;
        documentViewer.getTool('AnnotationCreateFreeText').setStyles({
          StrokeThickness: textState.strokeWidth,
          StrokeColor: new Annotations.Color(
            textState.strokeColor?.r ?? 0,
            textState.strokeColor?.g ?? 0,
            textState.strokeColor?.b ?? 0
          ),
          TextColor: new Annotations.Color(
            textState.textColor?.r ?? 0,
            textState.textColor?.g ?? 0,
            textState.textColor?.b ?? 0
          ),
          FontSize: `${textState.fontSize}pt`,
          FillColor: new Annotations.Color(
            textState.fillColor?.r ?? 255,
            textState.fillColor?.g ?? 255,
            textState.fillColor?.b ?? 255,
            textState.fillColor ? 1 : 0 // Set alpha to 1 if fill color is set, otherwise 0
          ),
          Opacity: textState.opacity,
        });
        instanceRef.current.UI.setToolMode('AnnotationCreateFreeText');
      } else {
        // instanceRef.current.UI.setToolMode('Pan');
        instanceRef.current.UI.setToolMode('AnnotationEdit');
      }
    }
  }, [instanceRef, selectedAnnotation, shapeState, textState, isViewerReady]);

  // popup for text annotation
  // useEffect(() => {
  //   if (!instanceRef.current || !isViewerReady) return;

  //   const { annotationManager, documentViewer, Annotations } = instanceRef.current.Core;

  //   const handleSelect = (annots: Core.Annotations.Annotation[]) => {
  //     if (annots.length === 0) {
  //       setSelectedTextAnnot(null);
  //       return;
  //     }

  //     const annot = annots[0];

  //     if (annot instanceof Annotations.FreeTextAnnotation) {
  //       // Tính vị trí để hiển thị popup
  //       const pageIndex = annot.PageNumber - 1;
  //       console.log('Selected text annotation:', pageIndex);

  //       const rect = annot.getRect();
  //       const x = rect.x1;
  //       const y = rect.y1;
  //       console.log('x, y:', x, y);

  //       const document = documentViewer.getDocument();
  //       console.log('document:', document);
  //       const coords = document.getViewerCoordinates(pageIndex, x, y);
  //       console.log('coords:', coords);

  //       const scrollElement = documentViewer.getScrollViewElement();
  //       const left = coords.x - scrollElement.scrollLeft;
  //       const top = coords.y - scrollElement.scrollTop;

  //       setPopupPosition({ top, left });
  //       setSelectedTextAnnot(annot);
  //     } else {
  //       setSelectedTextAnnot(null);
  //     }
  //   };

  //   annotationManager.addEventListener('annotationSelected', handleSelect);

  //   return () => {
  //     annotationManager.removeEventListener('annotationSelected', handleSelect);
  //   };
  // }, [isViewerReady]);

  // const displayCustomPopup = (annotation, instance) => {
  //   const { documentViewer, Annotations } = instance.Core;
  //   const pageIndex = annotation.PageNumber - 1;

  //   const quads = annotation.getQuads();
  //   if (!quads || quads.length === 0) return;

  //   const quad = quads[0];
  //   const { x1, y1 } = quad; // Lấy góc trên-trái của annotation

  //   // Chuyển từ tọa độ trang sang tọa độ màn hình
  //   const coords = documentViewer
  //     .getDisplayModeManager()
  //     .getDisplayMode()
  //     .getDocumentCoordinates(pageIndex, x1, y1);

  //   const container = instance.UI.viewerElement;
  //   const rect = container.getBoundingClientRect();

  //   const scrollElement = instance.Core.documentViewer.getScrollViewElement();

  //   const scrollLeft = scrollElement.scrollLeft;
  //   const scrollTop = scrollElement.scrollTop;

  //   const zoom = documentViewer.getZoom();

  //   const left = coords.x * zoom - scrollLeft;
  //   const top = coords.y * zoom - scrollTop;

  //   // Lưu lại vị trí popup
  //   setPopupPosition({ top, left });
  //   setSelectedTextAnnot(annotation);
  // };

  // Handle annotation added event for shape annotations
  // useEffect(() => {
  //   if (!instanceRef.current || !isViewerReady || selectedAnnotation !== 'shape') return;

  //   const { Core } = instanceRef.current;
  //   const toolName = getToolNameFromShapeType(shapeState.shapeType);
  //   const tool = Core.documentViewer.getTool(toolName);

  //   console.log('Current tool:', tool);
  //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //   const onAnnotAdded = (annot: typeof Core.Annotations.Annotation | any) => {
  //     const { Annotations } = Core;

  //     const isBuiltInShape =
  //       annot instanceof Annotations.RectangleAnnotation ||
  //       annot instanceof Annotations.EllipseAnnotation ||
  //       annot instanceof Annotations.LineAnnotation;

  //     const isTriangleShape = annot.Subject === 'Triangle' && annot.elementName === 'triangle';

  //     if (isBuiltInShape || isTriangleShape) {
  //       console.log('Shape annotation added:', annot);
  //       // Stroke
  //       if (shapeState.strokeColor) {
  //         annot.StrokeColor = new Annotations.Color(
  //           shapeState.strokeColor.r,
  //           shapeState.strokeColor.g,
  //           shapeState.strokeColor.b
  //         );
  //       }

  //       // Fill
  //       if ('FillColor' in annot && shapeState.fillColor) {
  //         annot.FillColor = new Annotations.Color(
  //           shapeState.fillColor.r,
  //           shapeState.fillColor.g,
  //           shapeState.fillColor.b
  //         );
  //       } else if ('FillColor' in annot) {
  //         annot.FillColor = new Annotations.Color(255, 255, 255, 0);
  //       }

  //       // Opacity, thickness
  //       annot.StrokeThickness = shapeState.strokeWidth;
  //       annot.Opacity = shapeState.opacity;

  //       Core.documentViewer.getAnnotationManager().redrawAnnotation(annot);
  //     }
  //   };

  //   tool.addEventListener('annotationAdded', onAnnotAdded);

  //   return () => {
  //     tool.removeEventListener('annotationAdded', onAnnotAdded);
  //   };
  // }, [shapeState, selectedAnnotation, isViewerReady, instanceRef.current]);

  // Handle annotation added event for text annotations
  // useEffect(() => {
  //   if (!instanceRef.current || !isViewerReady || selectedAnnotation !== 'text') return;

  //   const { Core } = instanceRef.current;
  //   const tool = Core.documentViewer.getTool('AnnotationCreateFreeText');

  //   // const onAnnotAdded = (annot: Core.Annotations.Annotation) => {
  //   //   const { Annotations } = Core;
  //   //   console.log('Text annotation added:', annot);

  //   //   if (annot instanceof Annotations.FreeTextAnnotation) {
  //   //     // Padding
  //   //     // annot.setPadding(new Core.Math.Rect(4, 4, 4, 4));

  //   //     // Font settings
  //   //     annot.FontSize = textState.fontSize.toString();

  //   //     // annot.setFont(textState.fontFamily);

  //   //     // Text color
  //   //     if (textState.textColor) {
  //   //       annot.TextColor = new Annotations.Color(
  //   //         textState.textColor.r,
  //   //         textState.textColor.g,
  //   //         textState.textColor.b
  //   //       );
  //   //     }

  //   //     // Stroke
  //   //     annot.StrokeThickness = textState.strokeWidth;
  //   //     if (textState.strokeColor) {
  //   //       annot.StrokeColor = new Annotations.Color(
  //   //         textState.strokeColor.r,
  //   //         textState.strokeColor.g,
  //   //         textState.strokeColor.b
  //   //       );
  //   //     }

  //   //     // Opacity
  //   //     annot.Opacity = textState.opacity;

  //   //     // Redraw
  //   //     Core.documentViewer.getAnnotationManager().redrawAnnotation(annot);
  //   //   }
  //   // };

  //   const onAnnotAdded = (annot: Core.Annotations.Annotation) => {
  //     const { Annotations } = Core;

  //     if (annot instanceof Annotations.FreeTextAnnotation) {
  //       const annotManager = Core.documentViewer.getAnnotationManager();
  //       console.log('Text annotation added:', annot);
  //       console.log('Text state:', `${textState.fontSize}pt`);
  //       annotManager.setAnnotationStyles(annot, {
  //         FontSize: `${textState.fontSize}pt`,
  //         // TextColor: new Core.Annotations.Color(
  //         //   textState.textColor?.r ?? 0,
  //         //   textState.textColor?.g ?? 0,
  //         //   textState.textColor?.b ?? 0
  //         // ),
  //         // StrokeThickness: textState.strokeWidth,
  //         // StrokeColor: new Core.Annotations.Color(
  //         //   textState.strokeColor?.r ?? 0,
  //         //   textState.strokeColor?.g ?? 0,
  //         //   textState.strokeColor?.b ?? 0
  //         // ),
  //         // Opacity: textState.opacity,
  //       });
  //       annotManager.redrawAnnotation(annot);
  //     }
  //   };

  //   tool.addEventListener('annotationAdded', onAnnotAdded);

  //   return () => {
  //     tool.removeEventListener('annotationAdded', onAnnotAdded);
  //   };
  // }, [textState, selectedAnnotation, isViewerReady]);

  return (
    <div className='flex-1 flex flex-col rounded-2xl overflow-hidden border-[1px] border-[#D9D9D9] relative'>
      <div className='flex-1 overflow-hidden '>
        <div className='webviewer' ref={viewer} style={{ height: '100%' }}></div>
      </div>
      {popupData.visible && (
        <div
          className='absolute z-10050'
          style={{
            top: popupData.y,
            left: popupData.x,
          }}
        >
          {/* <TextAnnotControl
            annotation={selectedTextAnnot}
            onClose={() => setSelectedTextAnnot(null)}
          /> */}
          <Button>checking for POPUP</Button>
        </div>
      )}

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
            setTextFillColor={setTextFillColor}
          />
        </div>
      </div>
    </div>
  );
}
