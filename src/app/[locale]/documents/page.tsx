'use client';
import { getColumns } from '@/app/[locale]/documents/column';
import { DataTable } from '@/components/data-table';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { UploadDialog } from '@/components/UploadDialog';
import type { FileMetadata } from '@/types/types';
import { useTranslations } from 'next-intl';
import { Spinner } from '@/components/ui/spinner';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { handleConnectGoogleDrive } from '@/lib/actions/google-authorize';

const LIMIT = 10;

interface DocumentsResponse {
  data: {
    documents: FileMetadata[];
    total: number;
  };
}

const Documents = React.memo(
  ({
    data,
    currUser,
    t,
    setAuthDialogData,
    setAuthDialogOpen,
    handleSorting,
  }: {
    data: FileMetadata[];
    currUser:
      | {
          id: string;
          email: string;
          name: string;
        }
      | null
      | undefined;
    t: (x: string) => void;
    setAuthDialogData: (data: {
      fileName: string;
      uploaderEmail: string;
      currAccountEmail?: string;
    }) => void;
    setAuthDialogOpen: (open: boolean) => void;
    handleSorting: () => void;
  }) => {
    const processedData = useMemo(() => {
      return data.map((doc) => ({
        ...doc,
        ownerName:
          doc.ownerName === currUser?.name ? `${doc.ownerName} (${t('you')})` : doc.ownerName,
      }));
    }, [data, currUser]);

    return (
      <div className='flex-1'>
        <DataTable<FileMetadata, unknown>
          columns={getColumns({ handleSorting })}
          data={processedData}
          setAuthDialogData={setAuthDialogData}
          setAuthDialogOpen={setAuthDialogOpen}
          currUser={currUser}
        />
      </div>
    );
  }
);

Documents.displayName = 'Documents';

const useDocuments = (
  userId: string | null | undefined,
  accessToken: string | null | undefined,
  sortOrd: 'asc' | 'desc'
) => {
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
      if (!userId) return;
      if (!accessToken) return;

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        ...(reset ? { documents: [], offset: 0, hasMore: true } : {}),
      }));

      let currentOffset = 0;
      let prevDocuments: FileMetadata[] = [];
      setState((prev) => {
        currentOffset = reset ? 0 : prev.offset;
        prevDocuments = reset ? [] : prev.documents;
        return prev;
      });

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/documents/count?ownerId=${userId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              authorization: `Bearer ${accessToken || ''}`,
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
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/documents?ownerId=${userId}&limit=${LIMIT}&offset=${currentOffset}&sortOrder=${sortOrd}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              authorization: `Bearer ${accessToken || ''}`,
            },
          }
        );

        if (!res.ok) throw new Error('Failed to fetch documents');

        const data: DocumentsResponse = await res.json();
        const { documents: newDocs } = data.data;

        // Lọc duplicate
        const mergedDocs = reset
          ? newDocs
          : [
              ...prevDocuments,
              ...newDocs.filter((doc) => !prevDocuments.some((d) => d.id === doc.id)),
            ];

        setState((prev) => ({
          ...prev,
          documents: mergedDocs,
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
    [userId, accessToken, sortOrd]
  );

  const loadMore = useCallback(() => {
    if (state.hasMore && !state.isLoading) {
      fetchDocuments();
    }
  }, [fetchDocuments, state.hasMore, state.isLoading]);

  const hasFetched = useRef(false);
  useEffect(() => {
    if (!userId || hasFetched.current) return;
    hasFetched.current = true;
    fetchDocuments(true);
  }, [userId, fetchDocuments]);

  useEffect(() => {
    if (!userId) return;
    fetchDocuments(true); // reset lại documents mỗi khi sortOrd đổi hoặc user đổi
  }, [userId, sortOrd, fetchDocuments]);

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
    totalDocs: totalDocs.current,
  };
};

const DocsPage = () => {
  const { data: session, status } = useSession();
  const loaderRef = useRef<HTMLDivElement>(null);
  const [sortOrd, setSortOrd] = useState<'asc' | 'desc'>('desc');

  const userId = session?.user?.id;
  const accessToken = session?.accessToken;

  const { documents, isLoading, error, hasMore, loadMore, updateDocuments, totalDocs } =
    useDocuments(userId, accessToken, sortOrd);
  const t = useTranslations('documents');
  const tAuthDialog = useTranslations('authDialog');

  const handleNewDocument = useCallback(
    (newDoc: FileMetadata) => {
      updateDocuments((prev) => (sortOrd === 'desc' ? [newDoc, ...prev] : [...prev, newDoc]));
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
    onSuccess?: (newAccId: string) => void;
  } | null>(null);

  if (status === 'loading' && !session) {
    return <Spinner className='flex justify-center items-center h-screen' />;
  }

  const handleSorting = () => {
    setSortOrd((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  return (
    <div className='px-6 py-6 w-full flex flex-col h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] gap-6'>
      <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
        <DialogContent className='z-1000000'>
          <DialogHeader>
            <DialogTitle>{tAuthDialog('title')}</DialogTitle>
            <DialogDescription className='text-start pt-4'>
              {authDialogData?.currAccountEmail && (
                <>
                  <strong>{tAuthDialog('detail') + authDialogData?.currAccountEmail} </strong>{' '}
                  <br />
                </>
              )}
              <strong>{authDialogData?.fileName} </strong>
              {tAuthDialog('preDescription')}
              <br />
              <strong>{authDialogData?.uploaderEmail}</strong>.
              <br />
              {tAuthDialog('description')}
            </DialogDescription>
          </DialogHeader>

          <div className='mt-4 flex justify-end gap-2'>
            <Button variant='outline' onClick={() => setAuthDialogOpen(false)}>
              {tAuthDialog('cancelButton')}
            </Button>
            <Button
              onClick={() => {
                setAuthDialogOpen(false);
                handleConnectGoogleDrive(); // mở popup OAuth
              }}
            >
              {authDialogData?.currAccountEmail
                ? tAuthDialog('re-authButton')
                : tAuthDialog('authButton')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <div className='flex justify-between'>
        <div className='flex items-center'>
          <p className='text-2xl font-semibold tracking-tight pr-3'>{t('myDocuments')}</p>
          {totalDocs > 0 && (
            <div className='text-[#757575] text-sm pl-3 border-l-2 border-[#E3E8EF]'>
              {t('total')} {totalDocs}
            </div>
          )}
        </div>
        <UploadDialog
          session={session}
          onUploadSuccess={handleNewDocument}
          onAuthorizeSuccess={authDialogData?.onSuccess}
        />
      </div>

      <div className='h-full w-full flex border-[1px] border-[#D9D9D9] rounded-[12px] overflow-hidden'>
        {isLoading && documents.length === 0 ? (
          <div className='flex-1 flex justify-center items-center'>
            <Spinner className='flex justify-center items-center h-full w-full' />
          </div>
        ) : documents.length > 0 ? (
          <div className='overflow-auto scroll-container flex-1'>
            <Documents
              handleSorting={handleSorting}
              data={documents}
              currUser={session?.user}
              t={t}
              setAuthDialogData={setAuthDialogData}
              setAuthDialogOpen={setAuthDialogOpen}
            />
            {hasMore && <div ref={loaderRef} className='h-10' />}
            {isLoading && (
              <div className='p-4 text-center'>
                <Spinner size='small' />
              </div>
            )}
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

        {/* {error && <div className='p-4 text-center text-red-500'>Error: {error}</div>} */}
      </div>
    </div>
  );
};

export default DocsPage;
