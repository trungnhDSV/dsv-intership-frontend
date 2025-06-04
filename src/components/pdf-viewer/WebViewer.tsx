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
  updateFreeTextAnnotationFields,
  updateShapeAnnotationFields,
} from '@/lib/annotations/annotationStyle';
import { TextAnnoInitState, ShapeAnnoInitState } from '@/constants/annotations';
import { ArrowLeft, Download, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { FileMetadata } from '@/types/types';
import ShareDialog from '@/components/ShareDialog';

interface WebViewerProps {
  initialDoc: string | null;
  docData: FileMetadata | null;
  accessToken: string | undefined;
  role: 'owner' | 'viewer' | 'editor' | null;
}

export default function WebViewer({ initialDoc, docData, accessToken, role }: WebViewerProps) {
  const router = useRouter();

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

  // shareDialog state
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const handleOpenShareDialog = () => {
    setIsShareDialogOpen(true);
  };

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
        webViewerInstance.Core.setCustomFontURL('/fonts/');
        // Store instance
        instanceRef.current = webViewerInstance;

        // Annotation setup
        const { documentViewer } = webViewerInstance.Core;
        const annotManager = documentViewer.getAnnotationManager();

        documentViewer.addEventListener('documentLoaded', async () => {
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

          // LOAD ANNOTATIONS
          // 1. Gọi API lấy annotation XFDF từ backend
          try {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/documents/${docData?.id}/annotations`,
              {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  authorization: `Bearer ${accessToken || ''}`,
                },
              }
            );
            const data = await res.json();
            if (data.data.url) {
              // 2. Fetch content từ presigned url
              const xfdfRes = await fetch(data.data.url);
              const xfdfString = await xfdfRes.text();

              // 3. Import annotation vào WebViewer
              await annotManager.importAnnotations(xfdfString);

              // Nếu muốn fit page/refresh có thể gọi:
              // instanceRef.current.Core.documentViewer.updateView();
            }
          } catch (err) {
            console.error('Failed to load annotation:', err);
          }

          // handle for role viewer
          if (role === 'viewer') {
            annotManager.enableReadOnlyMode();
          }
          // set page coordinates for popup annotation
          annotManager.addEventListener(
            'annotationSelected',
            function (annotations: Core.Annotations.FreeTextAnnotation[] | ShapeAnnotations[]) {
              if (role === 'viewer') return; // Prevent popup in viewer mode
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
                const pagePoint = {
                  x: annotRect.x2,
                  y: annotRect.getBottom(),
                };
                const displayMode = documentViewer.getDisplayModeManager().getDisplayMode();
                const windowPoint = displayMode.pageToWindow(pagePoint, currentPage);

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

        console.log('WebViewer initialized with document:', docData, initialDoc, accessToken);
      } catch (error) {
        console.error('Error initializing WebViewer:', error);
      }
    };

    initializeWebViewer();
  }, [viewer.current, initialDoc]);

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
  }, [selectedAnnotation, shapeState, textState, isViewerReady]);

  // update UI for selected annotation
  useEffect(() => {
    if (!selectedSpecificAnnot || !instanceRef.current || !isViewerReady) return;

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
      Core.annotationManager.trigger('annotationChanged', [[selectedSpecificAnnot], 'modify', {}]);
    }
  }, [
    textAnnoStateHook.textState,
    selectedSpecificAnnot,
    shapeAnnoStateHook.shapeState,
    instanceRef.current,
    isViewerReady,
  ]);

  // handle auto-fit text when freetext annotation changes
  useEffect(() => {
    if (!isViewerReady || !instanceRef.current) return;

    const annotManager = instanceRef.current.Core.documentViewer.getAnnotationManager();
    const { Annotations, documentViewer } = instanceRef.current.Core;

    const handleAnnotationChanged = (
      annotations: Core.Annotations.Annotation[],
      action: string
    ) => {
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
        } else documentViewer.getAnnotationManager().redrawAnnotation(annotation);
      });
    };

    annotManager.addEventListener('annotationChanged', handleAnnotationChanged);

    return () => {
      annotManager.removeEventListener('annotationChanged', handleAnnotationChanged);
    };
  }, [isViewerReady, instanceRef.current]);

  // handle auto save when annotations change
  useEffect(() => {
    if (!instanceRef.current || !accessToken || !isViewerReady) return;

    const annotManager = instanceRef.current.Core.documentViewer.getAnnotationManager();
    let saveTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleAnnotationChanged = async () => {
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(async () => {
        // 1. Export XFDF
        const xfdfString = await annotManager.exportAnnotations();

        // 2. Gửi lên backend
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/documents/${docData?.id}/annotations`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              authorization: `Bearer ${accessToken || ''}`,
            },
            body: JSON.stringify({ xfdf: xfdfString }),
          }
        );
        if (!res.ok) {
          console.error('Failed to save annotations:', res.statusText);
          return;
        }
        console.log('Annotations saved successfully');
      }, 2000); // chỉ gọi API nếu 2s không có thao tác mới
    };

    annotManager.addEventListener('annotationChanged', handleAnnotationChanged);

    return () => {
      annotManager.removeEventListener('annotationChanged', handleAnnotationChanged);
      if (saveTimeout) clearTimeout(saveTimeout);
    };
  }, [isViewerReady, docData, accessToken, instanceRef.current]);

  if (!docData) {
    return <div className='text-center text-gray-500'>Loading document...</div>;
  }

  const handleSetZoom = (newZoom: number) => {
    if (instanceRef.current) {
      instanceRef.current.Core.documentViewer.zoomTo(newZoom);
      setZoom(newZoom);
    }
  };
  const handleDownload = async () => {
    if (!instanceRef.current) return;
    console.log('Downloading PDF with annotations...');
    const { documentViewer } = instanceRef.current.Core;

    // Đảm bảo document đã load
    if (!documentViewer.getDocument()) return;

    try {
      // Xuất file PDF có annotation (blob)
      const xfdfString = await instanceRef.current.Core.annotationManager.exportAnnotations();
      const options = { xfdfString };
      const doc = await documentViewer.getDocument().getFileData(options);

      // Chuyển sang Blob
      const blob = new Blob([doc], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      // Tạo link download và trigger
      const a = document.createElement('a');
      a.href = url;
      a.download = docData.name || 'annotated.pdf'; // có thể dùng doc.name từ props
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
    }
  };
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
    <>
      {role === 'owner' && (
        <ShareDialog
          isOpen={isShareDialogOpen}
          handleClose={() => setIsShareDialogOpen(false)}
          docData={docData}
          accessToken={accessToken}
        />
      )}
      <div className='flex items-center justify-between'>
        <div className='flex items-center'>
          <div className='p-5 mr-3'>
            <ArrowLeft className='h-5 w-5 cursor-pointer' onClick={() => router.back()} />
          </div>
          <p className='font-semibold text-2xl'>{docData.name}</p>
          {role && role !== 'owner' && (
            <p className='border-l-[1px] mx-2 px-2 text-xs text-[#757575]'>{role}</p>
          )}
        </div>
        <div className='flex items-center gap-3'>
          <Button
            variant='outline'
            className='w-fit bg-[#E3E3E3] border-[#767676]'
            onClick={handleDownload}
          >
            <Download className='mr-2 h-4 w-4 cursor-pointer' />
            Download
          </Button>
          <Button
            variant='outline'
            className='w-fit bg-[#E3E3E3] border-[#767676]'
            onClick={() => {
              handleOpenShareDialog();
            }}
            disabled={role === 'owner' ? false : true} // Disable share button for non-owners
          >
            <Share className='mr-2 h-4 w-4' />
            Share
          </Button>
        </div>
      </div>
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
        {isViewerReady && role !== 'viewer' && (
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
        )}
      </div>
    </>
  );
}
