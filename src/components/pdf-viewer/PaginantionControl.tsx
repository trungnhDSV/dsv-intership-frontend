import { Button } from '@/components/ui/button';
import { WebViewerInstance } from '@pdftron/webviewer';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import React from 'react';

interface PaginantionControlProps {
  instanceRef: React.RefObject<WebViewerInstance | null>;
  numPages: number | null;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  isEditingPage: boolean;
  setIsEditingPage: React.Dispatch<React.SetStateAction<boolean>>;
  pageInput: string;
  setPageInput: React.Dispatch<React.SetStateAction<string>>;
  isViewerReady: boolean;
}

const PaginantionControl = ({
  instanceRef,
  numPages,
  currentPage,
  setCurrentPage,
  isEditingPage,
  setIsEditingPage,
  pageInput,
  setPageInput,
  isViewerReady,
}: PaginantionControlProps) => {
  // Navigation functions
  const setPage = (page: number) => {
    instanceRef.current?.Core.documentViewer.setCurrentPage(page, true);
    setCurrentPage(page);
    setPageInput(page.toString());
  };

  const goToFirstPage = () => {
    setPage(1);
  };
  const goToPreviousPage = () => {
    setCurrentPage((prev) => {
      const newPage = Math.max(prev - 1, 1);
      instanceRef.current?.Core.documentViewer.setCurrentPage(newPage, true);
      return newPage;
    });
    setPageInput((prev) => (parseInt(prev) - 1).toString());
  };
  const goToNextPage = () => {
    if (numPages) {
      setCurrentPage((prev) => {
        const newPage = Math.min(prev + 1, numPages);
        instanceRef.current?.Core.documentViewer.setCurrentPage(newPage, true);
        return newPage;
      });
      setPageInput((prev) => (parseInt(prev) + 1).toString());
    }
  };
  const goToLastPage = () => {
    setPage(numPages || 1);
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
        setPage(validPage);
      }
      setIsEditingPage(false);
    }
  };

  const handlePageInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!numPages) return;

    const pageNum = parseInt(e.target.value);
    if (!isNaN(pageNum)) {
      const validPage = Math.max(1, Math.min(pageNum, numPages));
      setPage(validPage);
    } else {
      setPageInput(currentPage.toString());
    }
    e.target.blur();
    setIsEditingPage(false);
  };

  return (
    <div className='flex items-center justify-center gap-2 w-fit'>
      <Button
        variant='ghost'
        onClick={goToFirstPage}
        disabled={currentPage <= 1 || !isViewerReady}
        className='p-2'
        aria-label='First page'
      >
        <ChevronsLeft className='h-4 w-4' />
      </Button>
      <Button
        variant='ghost'
        onClick={goToPreviousPage}
        disabled={currentPage <= 1 || !isViewerReady}
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
          onDoubleClick={() => {
            if (!isViewerReady) return;
            setIsEditingPage(true);
          }}
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
        disabled={!numPages || currentPage >= numPages || !isViewerReady}
        className='p-2'
        aria-label='Next page'
      >
        <ChevronRight className='h-4 w-4' />
      </Button>
      <Button
        variant='ghost'
        onClick={goToLastPage}
        disabled={!numPages || currentPage >= numPages || !isViewerReady}
        className='p-2'
        aria-label='Last page'
      >
        <ChevronsRight className='h-4 w-4' />
      </Button>
    </div>
  );
};

export default PaginantionControl;
