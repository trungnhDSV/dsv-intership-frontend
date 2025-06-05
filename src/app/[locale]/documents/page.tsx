'use client';
import { columns } from '@/app/[locale]/documents/column';
import { DataTable } from '@/components/data-table';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { UploadDialog } from '@/components/UploadDialog';
import type { FileMetadata } from '@/types/types';
import { Session } from 'next-auth';
import { useTranslations } from 'next-intl';
import { Spinner } from '@/components/ui/spinner';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { handleConnectGoogleDrive } from '@/lib/actions/google-authorize';

interface DocumentsResponse {
  data: {
    documents: FileMetadata[];
    total: number;
  };
}

const LIMIT = 10;

const Documents = React.memo(
  ({
    data,
    currUser,
    t,
    setAuthDialogData,
    setAuthDialogOpen,
  }: {
    data: FileMetadata[];
    currUser: string;
    t: (x: string) => void;
    setAuthDialogData: (data: {
      fileName: string;
      uploaderEmail: string;
      currAccountEmail?: string;
    }) => void;
    setAuthDialogOpen: (open: boolean) => void;
  }) => {
    const processedData = useMemo(() => {
      return data.map((doc) => ({
        ...doc,
        ownerName: doc.ownerName === currUser ? `${doc.ownerName} (${t('you')})` : doc.ownerName,
      }));
    }, [data, currUser]);

    return (
      <div className='flex-1'>
        <DataTable<FileMetadata, unknown>
          columns={columns}
          data={processedData}
          setAuthDialogData={setAuthDialogData}
          setAuthDialogOpen={setAuthDialogOpen}
        />
      </div>
    );
  }
);

Documents.displayName = 'Documents';

const useDocuments = (userId: string | null | undefined, session: Session | null) => {
  const [state, setState] = useState({
    documents: [] as FileMetadata[],
    offset: 0,
    hasMore: true,
    isLoading: false,
    error: null as string | null,
  });
  const totalDocs = useRef(0);

  const fetchDocuments = useCallback(
    async (reset = false) => {
      if (!userId || state.isLoading) return;

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        ...(reset ? { documents: [], offset: 0, hasMore: true } : {}),
      }));

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/documents/count?ownerId=${userId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              authorization: `Bearer ${session?.accessToken || ''}`,
            },
          }
        );
        if (!res.ok) throw new Error('Failed to fetch documents count');
        const data = await res.json();
        totalDocs.current = data.data.total;
      } catch (err) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Unknown error occurred',
        }));
        return;
      }

      try {
        const currentOffset = reset ? 0 : state.offset;
        console.log('Fetching documents with offset:', currentOffset);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/documents?ownerId=${userId}&limit=${LIMIT}&offset=${currentOffset}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              authorization: `Bearer ${session?.accessToken || ''}`,
            },
          }
        );

        if (!res.ok) throw new Error('Failed to fetch documents');

        const data: DocumentsResponse = await res.json();
        const { documents: newDocs, total } = data.data;
        console.log('total documents fetched:', total);
        const existingIds = new Set(state.documents.map((doc) => doc.id));
        const filteredNewDocs = newDocs.filter((doc) => !existingIds.has(doc.id));

        setState((prev) => ({
          documents: reset ? newDocs : [...prev.documents, ...newDocs],
          offset: currentOffset + newDocs.length,
          hasMore: currentOffset + newDocs.length < totalDocs.current,
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
    [userId, state.offset, state.isLoading, state.documents, session]
  );

  const loadMore = useCallback(() => {
    if (state.hasMore && !state.isLoading) {
      console.log('Loading more documents...');
      fetchDocuments();
    }
  }, [fetchDocuments, state.hasMore, state.isLoading]);

  const hasFetched = useRef(false);
  useEffect(() => {
    if (!userId || hasFetched.current) return;
    hasFetched.current = true;
    fetchDocuments(true);
  }, [userId, fetchDocuments]);

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
    updateDocuments,
  };
};

const DocsPage = () => {
  const { data: session, status } = useSession();
  const loaderRef = useRef<HTMLDivElement>(null);
  const { documents, isLoading, error, hasMore, loadMore, updateDocuments } = useDocuments(
    session?.user?.id,
    session
  );
  const t = useTranslations('documents');

  const handleNewDocument = useCallback(
    (newDoc: FileMetadata) => {
      updateDocuments((prev) => [newDoc, ...prev]);
    },
    [updateDocuments]
  );

  useEffect(() => {
    const rootNode = document.querySelector('.scroll-container');
    if (!loaderRef.current || !hasMore || !rootNode) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && loadMore(), {
      threshold: 0.1,
      root: rootNode,
      rootMargin: '30px',
    });

    const currentLoader = loaderRef.current;
    observer.observe(currentLoader);

    return () => observer.unobserve(currentLoader);
  }, [hasMore, loadMore, loaderRef]);

  useEffect(() => {
    if (!window.google?.picker) {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => window.gapi.load('picker', { callback: () => {} });
      document.body.appendChild(script);
    }
  }, []);

  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDialogData, setAuthDialogData] = useState<{
    fileName: string;
    uploaderEmail: string;
    currAccountEmail?: string;
  } | null>(null);

  if (status === 'loading')
    return <Spinner className='flex justify-center items-center h-screen' />;

  return (
    <div className='px-6 py-6 w-full flex flex-col h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] gap-6'>
      <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
        <DialogContent className='z-1000000'>
          {/* <div className='fixed inset-0 bg-black/70 backdrop-blur-sm z-[-1]' /> */}
          <DialogHeader>
            <DialogTitle>Google Drive Authorization Required</DialogTitle>
            <DialogDescription className='text-center pt-4'>
              {authDialogData?.currAccountEmail && (
                <>
                  <strong>You're sign in as {authDialogData?.currAccountEmail} </strong> <br />
                </>
              )}
              <strong>{authDialogData?.fileName} </strong>
              was uploaded using Google Drive account:
              <br />
              <strong>{authDialogData?.uploaderEmail}</strong>.
              <br />
              Please authorize that account to access this file.
            </DialogDescription>
          </DialogHeader>

          <div className='mt-4 flex justify-end gap-2'>
            <Button variant='outline' onClick={() => setAuthDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setAuthDialogOpen(false);
                handleConnectGoogleDrive(); // mở popup OAuth
              }}
            >
              {authDialogData?.currAccountEmail
                ? 'Re-authorize Google Drive'
                : 'Authorize Google Drive'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <div className='flex justify-between'>
        <div className='flex items-center'>
          <p className='text-2xl font-semibold tracking-tight pr-3'>{t('myDocuments')}</p>
          {documents.length > 0 && (
            <div className='text-[#757575] text-sm pl-3 border-l-2 border-[#E3E8EF]'>
              {t('total')} {documents.length}
            </div>
          )}
        </div>
        <UploadDialog session={session} onUploadSuccess={handleNewDocument} />
      </div>

      <div className='h-full w-full flex border-[1px] border-[#D9D9D9] rounded-[12px] overflow-hidden'>
        {isLoading ? (
          <div className='flex-1 flex justify-center items-center'>
            <Spinner className='flex justify-center items-center h-full w-full' />
          </div>
        ) : documents.length > 0 ? (
          <div className='overflow-auto scroll-container flex-1'>
            <Documents
              data={documents}
              currUser={session?.user?.name || ''}
              t={t}
              setAuthDialogData={setAuthDialogData}
              setAuthDialogOpen={setAuthDialogOpen}
            />
            {hasMore && <div ref={loaderRef} className='h-10' />}
            {isLoading && <div className='p-4 text-center'>{t('loading')}</div>}
          </div>
        ) : (
          <div className='flex-1 flex items-center justify-center'>
            <div className='w-fit h-full flex flex-col justify-center'>
              <div className='flex flex-col items-center justify-center gap-6 w-fit h-fit'>
                <Image src='/files-empty.png' alt='empty' width={192} height={192} priority />
                <p className='text-[#4B5565]'>{t('noDocuments')}</p>
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
