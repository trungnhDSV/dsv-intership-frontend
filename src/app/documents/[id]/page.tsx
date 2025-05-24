'use client';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Download, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FileMetadata } from '@/types/types';
import WebViewer from '@/components/pdf-viewer/WebViewer';

const DocPage = () => {
  const { id } = useParams();
  const [doc, setDoc] = useState<FileMetadata | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  // zoom state
  const router = useRouter();

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
    <div className='pt-6 pb-4 px-6 w-full flex flex-col h-[calc(100vh-64px)]'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center'>
          <div className='p-5 mr-3'>
            <ArrowLeft className='h-5 w-5 cursor-pointer' onClick={() => router.back()} />
          </div>
          <p className='font-semibold text-2xl'>{doc?.name}</p>
        </div>
        <div className='flex items-center gap-3'>
          <Button variant='outline' className='w-fit bg-[#E3E3E3] border-[#767676]'>
            <Download className='mr-2 h-4 w-4' />
            Download
          </Button>
          <Button variant='outline' className='w-fit bg-[#E3E3E3] border-[#767676]'>
            <Share className='mr-2 h-4 w-4' />
            Share
          </Button>
        </div>
      </div>
      <WebViewer initialDoc={url!} />
    </div>
  );
};

export default DocPage;
