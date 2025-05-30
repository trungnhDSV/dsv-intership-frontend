'use client';
import PaginantionControl from '@/components/pdf-viewer/PaginantionControl';
import { ZoomControls } from '@/components/pdf-viewer/ZoomControl';
import { Core, WebViewerInstance } from '@pdftron/webviewer';
import Image from 'next/image';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  updateFreeTextAnnotationFields,
  updateShapeAnnotationFields,
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
  const [zoom, setZoom] = useState<number>(1);

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
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let webViewerInstance: WebViewerInstance;
    const initializeWebViewer = async () => {
      try {
        if (!viewer.current || !initialDoc) return;
        if (!process.env.NEXT_PUBLIC_PDFTRON_LICENSE_KEY)
          throw new Error('PDFTron license key is not set in environment variables');
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
              // 'annotationPopup', // Ẩn popup chú thích
              // 'annotationCommentButton',
              // 'annotationStyleEditButton',
              // 'linkButton',
              // 'annotationDeleteButton',
            ],
          },
          viewer.current
        );

        webViewerInstance.UI.setLayoutMode(webViewerInstance.UI.LayoutMode.Single);
        webViewerInstance.UI.setFitMode(webViewerInstance.UI.FitMode.FitPage);
        webViewerInstance.Core.setCustomFontURL('/fonts/');
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

          annotManager.addEventListener(
            'annotationSelected',
            function (annotations: Core.Annotations.FreeTextAnnotation[] | ShapeAnnotations[]) {
              if (annotations.length === 1) {
                const annotation = annotations[0];

                const annotRect = annotation.getRect(); // PDF Coordinates, x1, y1: Top left ,x2, y2: Bottom right
                if (!annotRect) {
                  console.warn('Annotation has no valid rectangle');
                  return;
                }

                const scrollEl = webViewerInstance.Core.documentViewer.getScrollViewElement();
                const scrollLeft = scrollEl?.scrollLeft || 0;
                const scrollTop = scrollEl?.scrollTop || 0;
                // console.log('SCROLL ELEMENT:', scrollLeft, scrollTop);
                const pagePoint = {
                  x: annotRect.x2,
                  y: annotRect.y2,
                };
                const displayMode = documentViewer.getDisplayModeManager().getDisplayMode();
                const windowPoint = displayMode.pageToWindow(pagePoint, currentPage);
                // windowPoint.y += 60 + 24 + 64;
                // 60px for header, 24px for pt, 64px for controls

                setPopupData({
                  visible: true,
                  x: windowPoint.x - scrollLeft,
                  y: windowPoint.y - scrollTop,
                  annotation: annotation,
                });
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
                  shapeAnnoStateHook.setShapeType(shapeType.shapeType);
                  shapeAnnoStateHook.setShapeStrokeColor(shapeType.strokeColor);
                  shapeAnnoStateHook.setShapeStrokeWidth(shapeType.strokeWidth);
                  shapeAnnoStateHook.setShapeFillColor(shapeType.fillColor);
                  shapeAnnoStateHook.setShapeOpacity(shapeType.opacity);
                  shapeAnnoStateHook.setShapeRadioGroup(shapeType.radioGroup);
                }
              } else {
                console.log('Multiple annotations selected, hiding popup');
                setPopupData((prev) => ({
                  ...prev,
                  visible: false,
                  annotation: null,
                }));
              }
            }
          );
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
          Font: textState.fontFamily,
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

  // update UI for selected annotation
  useEffect(() => {
    if (!selectedSpecificAnnot || !instanceRef.current) return;

    const { Core } = instanceRef.current;
    let needRedraw = false;

    if (selectedSpecificAnnot instanceof Core.Annotations.FreeTextAnnotation) {
      needRedraw = updateFreeTextAnnotationFields(
        selectedSpecificAnnot,
        textAnnoStateHook.textState,
        Core
      );
    } else {
      needRedraw = updateShapeAnnotationFields(
        selectedSpecificAnnot,
        shapeAnnoStateHook.shapeState,
        Core
      );
    }

    // Redraw annotation
    if (needRedraw) {
      if (selectedSpecificAnnot instanceof Core.Annotations.FreeTextAnnotation)
        Core.annotationManager.trigger('annotationChanged', [
          [selectedSpecificAnnot],
          'modify',
          {},
        ]);
      else Core.documentViewer.getAnnotationManager().redrawAnnotation(selectedSpecificAnnot);
    }
  }, [
    textAnnoStateHook.textState,
    selectedSpecificAnnot,
    shapeAnnoStateHook.shapeState,
    instanceRef.current,
  ]);

  useEffect(() => {
    if (!isViewerReady || !instanceRef.current) return;

    const annotManager = instanceRef.current.Core.documentViewer.getAnnotationManager();
    const { Annotations, documentViewer } = instanceRef.current.Core;

    const handleAnnotationChanged = (
      annotations: Core.Annotations.Annotation[],
      action: string
    ) => {
      console.log('Listening to annotation changes:', action, annotations);
      annotations.forEach((annotation) => {
        if (annotation instanceof Annotations.FreeTextAnnotation) {
          if (action === 'add' || action === 'modify') {
            const doc = documentViewer.getDocument();
            const pageNumber = annotation.getPageNumber();
            const pageInfo = doc.getPageInfo(pageNumber);
            const pageMatrix = doc.getPageMatrix(pageNumber);
            const pageRotation = doc.getPageRotation(pageNumber);
            annotation.fitText(pageInfo, pageMatrix, pageRotation);
            annotManager.redrawAnnotation(annotation);
          }
        }
      });
    };

    annotManager.addEventListener('annotationChanged', handleAnnotationChanged);

    return () => {
      annotManager.removeEventListener('annotationChanged', handleAnnotationChanged);
    };
  }, [isViewerReady, instanceRef.current]);

  const handleDeleteAnnotation = () => {
    if (!instanceRef.current) return;
    const annotManager = instanceRef.current.Core.documentViewer.getAnnotationManager();
    const selectedAnnots = annotManager.getSelectedAnnotations();
    if (selectedAnnots.length === 1) {
      annotManager.deleteAnnotations(selectedAnnots);
      setPopupData((prev) => ({
        ...prev,
        visible: false,
        annotation: null,
      }));
      setSelectedSpecificAnnot(null);
    }
  };

  return (
    <div className='flex-1 flex flex-col rounded-2xl overflow-hidden border-[1px] border-[#D9D9D9] relative'>
      <div className='flex-1 overflow-hidden '>
        <div
          className='webviewer'
          ref={viewer}
          style={{ height: '100%' }}
          onMouseDown={() => {
            if (!viewer.current || !instanceRef.current) return;
            const annotManager = instanceRef.current.Core.documentViewer.getAnnotationManager();
            const selectedAnnots = annotManager.getSelectedAnnotations();
            if (selectedAnnots.length === 0) {
              // Người dùng click nền (viewer), không phải annotation
              console.log('Clicked on empty viewer');
              if (popupData.visible && popupData.annotation) {
                setPopupData((prev) => ({
                  ...prev,
                  visible: false,
                  annotation: null,
                }));
              }
            }
          }}
        ></div>
      </div>
      {popupData.visible &&
        isViewerReady &&
        selectedSpecificAnnot &&
        selectedSpecificAnnot.Subject && (
          <div
            className='absolute z-10050'
            ref={popupRef}
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
                handleDeleteAnnotation={handleDeleteAnnotation}
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
                handleDeleteAnnotation={handleDeleteAnnotation}
              />
            )}
          </div>
        )}

      {/* Controls Bar */}
      <div className='flex items-center justify-center py-3 px-2 gap-2 bg-white border-t border-[#D9D9D9] h-fit'>
        {/* Zoom Controls */}
        <ZoomControls zoom={zoom} setZoom={handleSetZoom} isViewerReady={isViewerReady} />

        {/* Page Navigation */}
        <PaginantionControl
          isViewerReady={isViewerReady}
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
