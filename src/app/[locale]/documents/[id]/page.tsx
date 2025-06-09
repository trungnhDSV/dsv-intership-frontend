'use client';
import { useParams } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import type { FileMetadata } from '@/types/types';
import WebViewer from '@/components/pdf-viewer/WebViewer';
import { useSession } from 'next-auth/react';
import NotFound from '@/app/[locale]/documents/[id]/NotFound';

const DocPage = () => {
  const { data: session } = useSession();

  const { id } = useParams();
  const [doc, setDoc] = useState<FileMetadata | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [role, setRole] = useState<'owner' | 'viewer' | 'editor' | null>('owner');
  const [loading, setLoading] = useState(true);
  const [docNotFound, setDocNotFound] = useState(false);
  // Fetch document data
  useEffect(() => {
    if (!id || !session) return;
    const fetchDoc = async () => {
      try {
        setLoading(true);
        const s3KeyRes = await fetch(process.env.NEXT_PUBLIC_API_URL + `/documents/${id}`, {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        });
        if (!s3KeyRes.ok) {
          const errorData = await s3KeyRes.json();
          // throw new Error(errorData.message || 'Failed to fetch document data');
          if (errorData.message === 'Document not found') {
            setLoading(false);
            setDocNotFound(true);
            return;
          }
        }
        const docData = await s3KeyRes.json();
        setDoc(docData.data);
        console.log('Document data:', docData.data);
        setRole(() => {
          console.log(
            docData.data.ownerId.id,
            session.user?.id,
            docData.data.ownerId.id === session.user?.id
          );
          if (docData.data.ownerId.id === session.user?.id) {
            return 'owner';
          } else {
            for (const member of docData.data.members) {
              if (member.userId === session.user?.id) {
                return member.role;
              }
            }
          }
          return null;
        });

        const urlRes = await fetch(
          process.env.NEXT_PUBLIC_API_URL + `/documents/presign?s3Key=${docData.data.s3Key}`,
          {
            headers: {
              Authorization: `Bearer ${session?.accessToken}`,
            },
          }
        );
        const urlData = await urlRes.json();
        setUrl(urlData.data.url);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching document:', error);
        setLoading(false);
      }
    };

    fetchDoc();
  }, [id, session?.accessToken]);

  const memoWebViewer = useMemo(
    () => (
      <WebViewer initialDoc={url} docData={doc} accessToken={session?.accessToken} role={role} />
    ),
    [url, doc, session?.accessToken, role]
  );

  if (docNotFound) {
    return (
      <div className='pt-6 pb-4 px-6 w-full flex flex-col h-[calc(100vh-64px)] relative'>
        <NotFound email={session?.user?.email} is404={true} />
      </div>
    );
  }

  if (!loading && role === null) {
    return (
      <div className='pt-6 pb-4 px-6 w-full flex flex-col h-[calc(100vh-64px)] relative'>
        <NotFound email={session?.user?.email} />
      </div>
    );
  }

  return (
    <>
      {/* <ShareDialog isOpen={isShareDialogOpen} docData={doc} /> */}
      <div className='pt-6 pb-4 px-6 w-full flex flex-col h-[calc(100vh-64px)] relative'>
        {memoWebViewer}
      </div>
    </>
  );
};

export default DocPage;
