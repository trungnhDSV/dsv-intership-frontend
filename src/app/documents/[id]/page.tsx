'use client';
import { Document, Page, pdfjs } from 'react-pdf';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Share,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ZoomControls } from '@/components/ZoomControl';
import type { FileMetadata } from '@/types/types';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;

const ZOOM_STEP = 0.25;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;

const DocPage = () => {
  const { id } = useParams();
  const [doc, setDoc] = useState<FileMetadata | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isEditingPage, setIsEditingPage] = useState<boolean>(false);
  const [pageInput, setPageInput] = useState<string>('1');
  const [containerWidth, setContainerWidth] = useState<number>(600);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // zoom state
  const [zoom, setZoom] = useState<number>(1);
  const router = useRouter();

  // Fetch document data
  useEffect(() => {
    if (!id) return;
    const fetchDoc = async () => {
      try {
        const s3KeyRes = await fetch(
          process.env.NEXT_PUBLIC_API_URL + `/documents/${id}`
        );
        const docData = await s3KeyRes.json();
        setDoc(docData.data);

        const urlRes = await fetch(
          process.env.NEXT_PUBLIC_API_URL +
            `/documents/presign?s3Key=${docData.data.s3Key}`
        );
        const urlData = await urlRes.json();
        setUrl(urlData.data.url);
      } catch (error) {
        console.error('Error fetching document:', error);
      }
    };

    fetchDoc();
  }, [id]);
  // Set initial container width and handle resize crtl +
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(
          containerRef.current.clientWidth -
            containerRef.current.clientWidth / 2
        );
      }
    };
    updateWidth();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          setZoom((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
        } else if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          setZoom((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
        } else if (e.key === '0') {
          e.preventDefault();
          setZoom(1); // Reset zoom to 100%
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', updateWidth);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updateWidth);
    };
  }, []);
  // Add wheel zooming (for trackpad/mouse wheel)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
        setZoom((prev) => {
          const newZoom = prev + delta;
          return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
        });
      }
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // Navigation functions
  const goToFirstPage = () => {
    setCurrentPage(1);
    setPageInput('1');
  };
  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
    setPageInput((prev) => (parseInt(prev) - 1).toString());
  };
  const goToNextPage = () => {
    if (numPages) {
      setCurrentPage((prev) => Math.min(prev + 1, numPages));
      setPageInput((prev) => (parseInt(prev) + 1).toString());
    }
  };
  const goToLastPage = () => {
    if (numPages) {
      setCurrentPage(numPages);
      setPageInput(numPages.toString());
    }
  };

  // Page input handling
  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };
  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!numPages) {
        setPageInput(currentPage.toString());
        return;
      }

      const pageNum = parseInt(pageInput);
      if (!isNaN(pageNum)) {
        const validPage = Math.max(1, Math.min(pageNum, numPages));
        setCurrentPage(validPage);
        setPageInput(validPage.toString());
      }
      setIsEditingPage(false);
    }
  };

  const handlePageInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!numPages) return;

    const pageNum = parseInt(e.target.value);
    if (!isNaN(pageNum)) {
      const validPage = Math.max(1, Math.min(pageNum, numPages));
      setCurrentPage(validPage);
      setPageInput(validPage.toString());
    } else {
      setPageInput(currentPage.toString());
    }
    e.target.blur();
    setIsEditingPage(false);
  };
  return (
    <div className='pt-6 pb-4 px-6 w-full flex flex-col h-[calc(100vh-64px)]'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center'>
          <div className='p-5 mr-3'>
            <ArrowLeft
              className='h-5 w-5 cursor-pointer'
              onClick={() => router.back()}
            />
          </div>
          <p className='font-semibold text-2xl'>{doc?.name}</p>
        </div>
        <div className='flex items-center gap-3'>
          <Button
            variant='outline'
            className='w-fit bg-[#E3E3E3] border-[#767676]'
          >
            <Download className='mr-2 h-4 w-4' />
            Download
          </Button>
          <Button
            variant='outline'
            className='w-fit bg-[#E3E3E3] border-[#767676]'
          >
            <Share className='mr-2 h-4 w-4' />
            Share
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className='flex-1 flex justify-center bg-[#F5F5F5] overflow-auto'
      >
        <Document
          className={'pt-6'}
          file={url}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={<div className='text-center p-4'>Loading PDF...</div>}
          error={
            <div className='text-center p-4 text-red-500'>
              Failed to load PDF
            </div>
          }
        >
          <Page
            pageNumber={currentPage}
            width={containerWidth * zoom}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      </div>

      {/* Controls Bar */}
      <div className='flex items-center justify-center py-4 gap-2 bg-white border-t'>
        {/* Zoom Controls */}
        <ZoomControls zoom={zoom} setZoom={setZoom} />

        {/* Page Navigation */}
        <div className='flex items-center justify-center gap-2 w-fit'>
          <Button
            variant='ghost'
            onClick={goToFirstPage}
            disabled={currentPage <= 1}
            className='p-2'
            aria-label='First page'
          >
            <ChevronsLeft className='h-4 w-4' />
          </Button>
          <Button
            variant='ghost'
            onClick={goToPreviousPage}
            disabled={currentPage <= 1}
            className='p-2'
            aria-label='Previous page'
          >
            <ChevronLeft className='h-4 w-4' />
          </Button>

          <div className='flex items-center gap-2'>
            {/*  */}
            <Button
              variant='ghost'
              className='w-16 border-r-none rounded-none p-0'
              onDoubleClick={() => setIsEditingPage(true)}
            >
              {isEditingPage ? (
                <input
                  type='number'
                  min='1'
                  max={numPages || 1}
                  value={pageInput}
                  onChange={handlePageInputChange}
                  onKeyDown={handlePageInputKeyDown}
                  onBlur={handlePageInputBlur}
                  className='w-14 py-1 border rounded text-sm text-center'
                />
              ) : (
                `${pageInput}`
              )}
            </Button>

            <span className='text-sm text-[#757575]'>/{numPages}</span>
          </div>

          <Button
            variant='ghost'
            onClick={goToNextPage}
            disabled={!numPages || currentPage >= numPages}
            className='p-2'
            aria-label='Next page'
          >
            <ChevronRight className='h-4 w-4' />
          </Button>
          <Button
            variant='ghost'
            onClick={goToLastPage}
            disabled={!numPages || currentPage >= numPages}
            className='p-2'
            aria-label='Last page'
          >
            <ChevronsRight className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DocPage;
