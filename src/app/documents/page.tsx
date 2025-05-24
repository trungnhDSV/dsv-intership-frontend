'use client';
import { columns } from '@/app/documents/column';
import { DataTable } from '@/components/data-table';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { UploadDialog } from '@/components/UploadDialog';
import type { FileMetadata } from '@/types/types';

interface DocumentsResponse {
  data: {
    documents: FileMetadata[];
    total: number;
  };
}

const LIMIT = 10;

function sortByDate(data: FileMetadata[], direction: 'asc' | 'desc') {
  return [...data].sort((a, b) => {
    const dateA = new Date(a.uploadedAt).getTime();
    const dateB = new Date(b.uploadedAt).getTime();
    return direction === 'asc' ? dateA - dateB : dateB - dateA;
  });
}

const Documents = React.memo(({ data, currUser }: { data: FileMetadata[]; currUser: string }) => {
  const processedData = useMemo(() => {
    return data.map((doc) => ({
      ...doc,
      ownerName: doc.ownerName === currUser ? `${doc.ownerName} (You)` : doc.ownerName,
    }));
  }, [data, currUser]);

  return (
    <div className='flex-1'>
      <DataTable<FileMetadata, unknown> columns={columns} data={processedData} />
    </div>
  );
});

Documents.displayName = 'Documents';

const useDocuments = (userId?: string, initialSortOrder: 'asc' | 'desc' = 'desc') => {
  const [state, setState] = useState({
    documents: [] as FileMetadata[],
    offset: 0,
    hasMore: true,
    isLoading: false,
    error: null as string | null,
  });
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder);
  const fetchDocuments = useCallback(
    async (reset = false) => {
      if (!userId || state.isLoading) return;

      if (reset) console.log('Fetching documents on mount or sort order change');

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        ...(reset ? { documents: [], offset: 0, hasMore: true } : {}),
      }));

      try {
        const currentOffset = reset ? 0 : state.offset;
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/documents?ownerId=${userId}&limit=${LIMIT}&offset=${currentOffset}&sortOrder=${sortOrder}`
        );

        if (!res.ok) throw new Error('Failed to fetch documents');

        const data: DocumentsResponse = await res.json();
        const { documents: newDocs, total } = data.data;
        // Check if newDocs already exist in documents to avoid duplicates
        const existingIds = new Set(state.documents.map((doc) => doc.id));
        const filteredNewDocs = newDocs.filter((doc) => !existingIds.has(doc.id));
        console.log('Fetched documents:', filteredNewDocs);

        setState((prev) => ({
          documents: reset ? newDocs : [...prev.documents, ...newDocs],
          offset: currentOffset + newDocs.length,
          hasMore: currentOffset + newDocs.length < total,
          isLoading: false,
          error: null,
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Unknown error occurred',
        }));
      }
    },
    [userId, sortOrder, state.offset, state.isLoading]
  );

  const loadMore = useCallback(() => {
    if (state.hasMore && !state.isLoading) {
      fetchDocuments();
    }
  }, [fetchDocuments, state.hasMore, state.isLoading]);

  const handleSortChange = useCallback((newOrder: 'asc' | 'desc') => {
    setSortOrder(newOrder);
  }, []);

  const hasFetched = useRef(false);
  useEffect(() => {
    if (!userId || hasFetched.current) return;
    hasFetched.current = true;
    fetchDocuments(true);
  }, [userId, sortOrder]);

  useEffect(() => {
    console.log('Resetting documents state');
    return () => {
      setState((prev) => ({
        ...prev,
        documents: [],
        offset: 0,
        hasMore: true,
        isLoading: false,
        error: null,
      }));
    };
  }, []);

  const updateDocuments = useCallback((updater: (prev: FileMetadata[]) => FileMetadata[]) => {
    setState((prev) => ({
      ...prev,
      documents: updater(prev.documents),
    }));
  }, []);

  return {
    documents: state.documents,
    isLoading: state.isLoading,
    error: state.error,
    hasMore: state.hasMore,
    loadMore,
    sortOrder,
    setSortOrder: handleSortChange,
    updateDocuments,
    resetState: () => {
      setState((prev) => ({
        ...prev,
        documents: [],
        offset: 0,
        hasMore: true,
        isLoading: false,
        error: null,
      }));
    },
  };
};

const DocsPage = () => {
  const { data: session, status } = useSession();
  const loaderRef = useRef<HTMLDivElement>(null);
  const {
    documents,
    isLoading,
    error,
    hasMore,
    loadMore,
    sortOrder,
    setSortOrder,
    // Thêm hàm updateDocuments từ custom hook
    updateDocuments,
  } = useDocuments(session?.user?.id);

  const handleNewDocument = useCallback((newDoc: FileMetadata) => {
    updateDocuments((prev) => {
      console.log('Adding new document:', newDoc);
      console.log('Previous documents:', prev);
      console.log('Updated documents:', [newDoc, ...prev]);
      return [newDoc, ...prev];
    });
  }, []);

  useEffect(() => {
    const rootNode = document.querySelector('.scroll-container');
    if (!loaderRef.current || !hasMore || !rootNode) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMore();
        }
      },
      {
        threshold: 0.1,
        root: rootNode,
        rootMargin: '30px',
      }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) observer.observe(currentLoader);

    return () => {
      if (currentLoader) observer.unobserve(currentLoader);
    };
  }, [hasMore, loadMore]);

  if (status === 'loading') return null;

  return (
    <div className='px-6 py-6 w-full flex flex-col h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] gap-6'>
      <div className='flex justify-between'>
        <div className='flex items-center'>
          <p className='text-2xl font-semibold tracking-tight pr-3'>My Documents</p>
          {documents.length > 0 && (
            <div className='text-[#757575] text-sm pl-3 border-l-2 border-[#E3E8EF]'>
              Total {documents.length}
            </div>
          )}
        </div>
        <UploadDialog session={session} onUploadSuccess={handleNewDocument} />
      </div>

      <div className='h-full w-full flex border-[1px] border-[#D9D9D9] rounded-[12px] overflow-hidden'>
        {documents.length > 0 ? (
          <div className='overflow-auto scroll-container flex-1'>
            <Documents
              data={sortByDate(documents, sortOrder)}
              currUser={session?.user?.name || ''}
            />
            {hasMore && <div ref={loaderRef} className='h-10' />}
            {isLoading && <div className='p-4 text-center'>Loading more documents...</div>}
          </div>
        ) : (
          <div className='flex-1 flex items-center justify-center'>
            <div className='w-fit h-full flex flex-col justify-center'>
              <div className='flex flex-col items-center justify-center gap-6 w-fit h-fit'>
                <Image src='/files-empty.png' alt='empty' width={192} height={192} priority />
                <p className='text-[#4B5565]'>There are no documents found</p>
                <UploadDialog session={session} onUploadSuccess={handleNewDocument} />
              </div>
            </div>
          </div>
        )}
        {error && <div className='p-4 text-center text-red-500'>Error: {error}</div>}
      </div>
    </div>
  );
};

export default DocsPage;
