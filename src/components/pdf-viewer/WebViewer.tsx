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
import {
  extractFreeTextState,
  extractShapeState,
  getToolNameFromShapeType,
  ShapeAnnotations,
} from '@/lib/annotations/annotationStyle';
import { TextAnnoInitState, ShapeAnnoInitState } from '@/constants/annotations';

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
  } = useTextAnnotationState(TextAnnoInitState);

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
  } = useShapeAnnotationState(ShapeAnnoInitState);

  // Popup data for annotation
  const [selectedSpecificAnnot, setSelectedSpecificAnnot] = useState<
    Core.Annotations.FreeTextAnnotation | ShapeAnnotations | null
  >(null);
  const textAnnoStateHook = useTextAnnotationState(TextAnnoInitState);
  const shapeAnnoStateHook = useShapeAnnotationState(ShapeAnnoInitState);

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
    console.log('WebViewer component mounted');
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
          annotManager.addEventListener(
            'annotationSelected',
            function (annotations: Core.Annotations.FreeTextAnnotation[] | ShapeAnnotations[]) {
              if (annotations.length === 1) {
                const annotation = annotations[0];
                console.log('SELECTED ANNOTATION:', annotation);
                setPopupData((prev) => ({
                  ...prev,
                  visible: true,
                  annotation,
                }));
                setSelectedSpecificAnnot(annotation);
                // Update text state from selected annotation
                if (annotation.Subject === 'Free Text') {
                  const textState = extractFreeTextState(
                    annotation as Core.Annotations.FreeTextAnnotation
                  );
                  textAnnoStateHook.setText(textState.text);
                  textAnnoStateHook.setFontFamily(textState.fontFamily);
                  textAnnoStateHook.setFontSize(textState.fontSize);
                  textAnnoStateHook.setTextColor(textState.textColor);
                  textAnnoStateHook.setTextStrokeColor(textState.strokeColor);
                  textAnnoStateHook.setTextStrokeWidth(textState.strokeWidth);
                  textAnnoStateHook.setTextFillColor(textState.fillColor);
                  textAnnoStateHook.setTextOpacity(textState.opacity);
                  textAnnoStateHook.setTextRadioGroup(textState.radioGroup);
                } else {
                  const shapeType = extractShapeState(annotation as ShapeAnnotations);
                  console.log('SHAPE TYPE:', shapeType);
                  shapeAnnoStateHook.setShapeType(shapeType.shapeType);
                  shapeAnnoStateHook.setShapeStrokeColor(shapeType.strokeColor);
                  shapeAnnoStateHook.setShapeStrokeWidth(shapeType.strokeWidth);
                  shapeAnnoStateHook.setShapeFillColor(shapeType.fillColor);
                  shapeAnnoStateHook.setShapeOpacity(shapeType.opacity);
                  shapeAnnoStateHook.setShapeRadioGroup(shapeType.radioGroup);
                }
              } else {
                setPopupData((prev) => ({
                  ...prev,
                  visible: false,
                  annotation: null,
                }));
              }
            }
          );

          annotManager.addEventListener('annotationDeselected', (annotations) => {
            console.log('DESELECTED ANNOTATION:', annotations);
            setPopupData((prev) => ({
              ...prev,
              visible: false,
              annotation: null,
            }));
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

  // Update tool mode style when creating annotations
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

  // update UI for selected annotation
  useEffect(() => {
    if (!selectedSpecificAnnot || !instanceRef.current) return;

    const { Core } = instanceRef.current;

    if (selectedSpecificAnnot instanceof Core.Annotations.FreeTextAnnotation) {
      const { textState } = textAnnoStateHook;

      selectedSpecificAnnot.FontSize = textState.fontSize.toString();
      if (textState.textColor) {
        selectedSpecificAnnot.TextColor = new Core.Annotations.Color(
          textState.textColor.r,
          textState.textColor.g,
          textState.textColor.b
        );
      }
      selectedSpecificAnnot.StrokeThickness = textState.strokeWidth;
      selectedSpecificAnnot.StrokeColor = new Core.Annotations.Color(
        textState.strokeColor?.r ?? 255,
        textState.strokeColor?.g ?? 255,
        textState.strokeColor?.b ?? 255,
        textState.strokeColor ? 1 : 0 // Set alpha to 1 if stroke color is set, otherwise 0
      );
      selectedSpecificAnnot.FillColor = new Core.Annotations.Color(
        textState.fillColor?.r ?? 255,
        textState.fillColor?.g ?? 255,
        textState.fillColor?.b ?? 255,
        textState.fillColor ? 1 : 0 // Set alpha to 1 if fill color is set, otherwise 0
      );

      selectedSpecificAnnot.Opacity = textState.opacity;
    } else {
      console.log('Updating shape annotation:', selectedSpecificAnnot);
      const { shapeState } = shapeAnnoStateHook;
      selectedSpecificAnnot.StrokeThickness = shapeState.strokeWidth;
      selectedSpecificAnnot.StrokeColor = new Core.Annotations.Color(
        shapeState.strokeColor?.r ?? 255,
        shapeState.strokeColor?.g ?? 255,
        shapeState.strokeColor?.b ?? 255,
        shapeState.strokeColor ? 1 : 0 // Set alpha to 1 if stroke color is set, otherwise 0
      );
      console.log('Shape fill color:', shapeState.fillColor);
      selectedSpecificAnnot.FillColor = new Core.Annotations.Color(
        shapeState.fillColor?.r ?? 255,
        shapeState.fillColor?.g ?? 255,
        shapeState.fillColor?.b ?? 255,
        shapeState.fillColor?.a === 0 ? 0 : shapeState.fillColor?.a // Set alpha to 1 if fill color is set, otherwise 0
      );
      console.log('SET FILL COLOR:', selectedSpecificAnnot.FillColor);
      selectedSpecificAnnot.Opacity = shapeState.opacity;
    }

    console.log(selectedSpecificAnnot);
    // Redraw annotation
    const annotManager = Core.documentViewer.getAnnotationManager();
    annotManager.redrawAnnotation(selectedSpecificAnnot);
  }, [
    textAnnoStateHook.textState,
    selectedSpecificAnnot,
    shapeAnnoStateHook.shapeState,
    instanceRef.current,
  ]);

  return (
    <div className='flex-1 flex flex-col rounded-2xl overflow-hidden border-[1px] border-[#D9D9D9] relative'>
      <div className='flex-1 overflow-hidden '>
        <div
          className='webviewer'
          ref={viewer}
          style={{ height: '100%' }}
          onMouseDown={(e: React.MouseEvent) => {
            if (!viewer.current || !instanceRef.current) return;
            const { documentViewer } = instanceRef.current.Core;
            const annotManager = documentViewer.getAnnotationManager();
            const selectedAnnots = annotManager.getSelectedAnnotations();

            if (selectedAnnots.length === 0) {
              // Người dùng click nền (viewer), không phải annotation
              console.log('Clicked on empty viewer');
              const rect = viewer.current.getBoundingClientRect();

              const relativeX = e.clientX - rect.left;
              const relativeY = e.clientY - rect.top + 20;

              setPopupData((prev) => ({
                ...prev,
                visible: false,
                annotation: null,
                x: relativeX,
                y: relativeY,
              }));
            }
          }}
        ></div>
      </div>
      {popupData.visible && isViewerReady && selectedSpecificAnnot && (
        <div
          className='absolute z-10050'
          style={{
            top: popupData.y,
            left: popupData.x,
          }}
        >
          {selectedSpecificAnnot.Subject === 'Free Text' ? (
            <TextAnnotControl
              textState={textAnnoStateHook.textState}
              textOpacityInput={textAnnoStateHook.textOpacityInput}
              textStrokeWidthInput={textAnnoStateHook.textStrokeWidthInput}
              setTextInputOnSubmit={textAnnoStateHook.setTextInputOnSubmit}
              setTextInputIsEdit={textAnnoStateHook.setTextInputIsEdit}
              setTextInputChange={textAnnoStateHook.setTextInputChange}
              setFontFamily={textAnnoStateHook.setFontFamily}
              setFontSize={textAnnoStateHook.setFontSize}
              setTextColor={textAnnoStateHook.setTextColor}
              setTextStrokeColor={textAnnoStateHook.setTextStrokeColor}
              setTextStrokeWidth={textAnnoStateHook.setTextStrokeWidth}
              setTextOpacity={textAnnoStateHook.setTextOpacity}
              setTextRadioGroup={textAnnoStateHook.setTextRadioGroup}
              setTextFillColor={textAnnoStateHook.setTextFillColor}
              forSpecificAnnot={true}
            />
          ) : (
            <ShapeAnnotControl
              shapeState={shapeAnnoStateHook.shapeState}
              shapeOpacityInput={shapeAnnoStateHook.shapeOpacityInput}
              shapeStrokeWidthInput={shapeAnnoStateHook.shapeStrokeWidthInput}
              setShapeInputOnSubmit={shapeAnnoStateHook.setShapeInputOnSubmit}
              setShapeInputIsEdit={shapeAnnoStateHook.setShapeInputIsEdit}
              setShapeInputChange={shapeAnnoStateHook.setShapeInputChange}
              setShapeType={shapeAnnoStateHook.setShapeType}
              setShapeStrokeColor={shapeAnnoStateHook.setShapeStrokeColor}
              setShapeStrokeWidth={shapeAnnoStateHook.setShapeStrokeWidth}
              setShapeFillColor={shapeAnnoStateHook.setShapeFillColor}
              setShapeOpacity={shapeAnnoStateHook.setShapeOpacity}
              setShapeRadioGroup={shapeAnnoStateHook.setShapeRadioGroup}
              forSpecificAnnot={true}
            />
          )}
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
