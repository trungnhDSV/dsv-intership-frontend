'use client';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import type { FileMetadata } from '@/types/types';
import WebViewer from '@/components/pdf-viewer/WebViewer';
import { useSession } from 'next-auth/react';
import ShareDialog from '@/components/ShareDialog';

const DocPage = () => {
  const { data: session } = useSession();

  const { id } = useParams();
  const [doc, setDoc] = useState<FileMetadata | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  // Fetch document data
  useEffect(() => {
    if (!id) return;
    const fetchDoc = async () => {
      try {
        const s3KeyRes = await fetch(process.env.NEXT_PUBLIC_API_URL + `/documents/${id}`);
        const docData = await s3KeyRes.json();
        setDoc(docData.data);

        const urlRes = await fetch(
          process.env.NEXT_PUBLIC_API_URL + `/documents/presign?s3Key=${docData.data.s3Key}`
        );
        const urlData = await urlRes.json();
        setUrl(urlData.data.url);
      } catch (error) {
        console.error('Error fetching document:', error);
      }
    };

    fetchDoc();
  }, [id]);
  return (
    <>
      <ShareDialog isOpen={isShareDialogOpen} docData={doc} />
      <div className='pt-6 pb-4 px-6 w-full flex flex-col h-[calc(100vh-64px)] relative'>
        <WebViewer
          initialDoc={url}
          docData={doc}
          session={session}
          handleOpenShareDialog={() => setIsShareDialogOpen(true)}
        />
      </div>
    </>
  );
};

export default DocPage;
