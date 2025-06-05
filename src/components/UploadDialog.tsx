'use client';

import { useState, useRef } from 'react';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { showErrorToast, showSuccessToast } from '@/components/CustomToast';
import { MAX_FILE_SIZE } from '@/constants/UI';
import { checkPdfPassword } from '@/lib/pdf-util';
import { Session } from 'next-auth';
import { toast } from 'sonner';
import { FileMetadata } from '@/types/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu';
import { useListenGoogleDriveToken } from '@/app/hooks/useListenGoogleDriveToken';
import { useTranslations } from 'next-intl';
import { handleConnectGoogleDrive } from '@/lib/actions/google-authorize';

interface UploadDialogProps {
  session: Session | null;
  onUploadSuccess?: (newDocs: FileMetadata) => void;
}

const isGoogleTokenValid = async (token: string): Promise<boolean> => {
  try {
    const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      // Token expired or invalid
      return false;
    }

    return res.ok;
  } catch (error) {
    console.error('Error checking Google token validity:', error);
    return false;
  }
};

export function UploadDialog({ session, onUploadSuccess }: UploadDialogProps) {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations('documents');

  // handle trigger file input
  const handleTriggerFileInput = () => {
    if (!fileInputRef.current) return;
    fileInputRef.current.click();
  };

  useListenGoogleDriveToken((data) => {
    // Lưu access_token, refresh_token, profile vào localStorage/state/...
    localStorage.setItem('googleDriveToken', data.access_token);
    localStorage.setItem('googleDriveProfile', JSON.stringify(data.profile));
    showSuccessToast({
      title: 'Connected to Google Drive',
      description: `You are now connected to Google Drive as ${data.profile.email}`,
    });
    // handleGoogleDriveUpload();
  });

  // handle upload with Google Drive
  const handleGoogleDriveUpload = async () => {
    let googleToken = localStorage.getItem('googleDriveToken');
    console.log('Google token from localStorage:', googleToken);
    if (!googleToken || !(await isGoogleTokenValid(googleToken))) {
      handleConnectGoogleDrive();
      return;
      // let googleToken = localStorage.getItem('googleDriveToken');
    }
    if (!process.env.NEXT_PUBLIC_GOOGLE_API_KEY) {
      console.error('Missing Google API key in environment variables');
      return;
    }

    // 2. Load Google Picker API
    if (!window.google || !window.google.picker) {
      showErrorToast({
        title: 'Google Picker is not ready',
        description: 'Please try again after a few seconds.',
      });
      return;
    }

    const view = new window.google.picker.DocsView().setMimeTypes('application/pdf');
    const picker = new window.google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(googleToken)
      .setDeveloperKey(process.env.NEXT_PUBLIC_GOOGLE_API_KEY)
      .setCallback(async (data: any) => {
        if (data.action === window.google.picker.Action.PICKED) {
          const picked = data.docs[0];
          // 3. Tải file từ Google Drive về (dùng fetch với access token)

          const response = await fetch(
            `https://www.googleapis.com/drive/v3/files/${picked.id}?alt=media`,
            {
              headers: { Authorization: `Bearer ${googleToken}` },
            }
          );
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          console.log('Blob URL:', blobUrl);
          // 4. Tạo file từ blob
          const file = new File([blob], picked.name, { type: blob.type });
          // 5. Gọi lại handleUpload
          const profile = JSON.parse(localStorage.getItem('googleDriveProfile') || '{}');
          handleUpload(file, true, picked.id, profile);
        }
      })
      .build();
    picker.setVisible(true);
  };

  // Xử lý upload
  const handleUpload = async (
    file: File,
    byGGDrive: boolean = false,
    googleDriveFileId?: string,
    googleDriveProfile?: { email: string; id: string }
  ) => {
    setSelectedFile(file);
    console.log('Selected file:', file);

    if (!file || !session?.user?.id) {
      console.error('No file selected or user ID not found');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      showErrorToast({
        title: 'Cannot Upload This File',
        description: 'Please ensure the upload file is not more than 20MB and in .pdf format',
      });
      return;
    }
    const hasPassword = await checkPdfPassword(file);
    if (hasPassword) {
      showErrorToast({
        title: 'Cannot Upload This File',
        description: 'Please ensure the upload file does not require password',
      });
      return;
    }

    setIsDialogOpen(true);
    setIsUploading(true);
    setProgress(0);

    // Step 1: Request upload URL
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        userId: session.user.id,
      }),
    });
    console.log('Request upload URL response:', res);
    const data: {
      data: {
        url: string;
        s3Key: string;
      };
    } = await res.json();
    const { url, s3Key } = data.data;

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setProgress(percent);
      }
    });

    xhr.addEventListener('load', async () => {
      setIsUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        showSuccessToast({
          title: 'Uploaded successfully',
        });

        setIsDialogOpen(false);
        setSelectedFile(null);

        // Step 3: Save metadata to backend
        const metaPayload: {
          name: string;
          s3Key: string;
          fileSize: number;
          fileType: string;
          ownerId: string;
          googleDrive?: {
            fileId: string;
            email: string;
            accountId: string;
            mimeType: string;
          };
        } = {
          name: file.name,
          s3Key,
          fileSize: file.size,
          fileType: file.type,
          ownerId: session!.user!.id,
        };
        if (byGGDrive && googleDriveFileId && googleDriveProfile) {
          metaPayload.googleDrive = {
            fileId: googleDriveFileId || file.name,
            email: googleDriveProfile.email,
            accountId: googleDriveProfile.id,
            mimeType: file.type,
          };
        }

        console.log('Metadata payload:', metaPayload);

        const metaRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify(metaPayload),
        });
        const result: {
          data: FileMetadata;
        } | null = await metaRes.json();

        if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
        if (onUploadSuccess && result?.data) {
          onUploadSuccess(result?.data);
        }
      } else {
        toast.error('Uploaded Fail!');
      }
    });

    xhr.addEventListener('error', () => {
      setIsUploading(false);
      toast.error('Lỗi kết nối!');
    });

    xhr.open('PUT', url, true);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  };

  return (
    <>
      <input
        id='fileUpload'
        ref={fileInputRef}
        type='file'
        accept='application/pdf'
        className='hidden'
        onChange={(e) => {
          console.log('File input changed:', e.target.files);
          const file = e.target.files?.[0];
          if (file) {
            console.log('START HANDLE UPLOAD');
            handleUpload(file);
          }
          e.target.value = '';
        }}
      />
      <div>
        <DropdownMenu
          dir='ltr'
          //  open={isOpen} onOpenChange={() => setIsOpen(!isOpen)}
        >
          <DropdownMenuTrigger asChild>
            <Button variant='primary' type='button'>
              <Image src='/icon-upload.svg' alt='upload' width={16} height={16} className='mr-2' />
              {t('uploadDocument')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className='mt-3 mr-6 rounded-xl w-fit p-2 bg-white border-[1px] border-[#D9D9D9] z-10000'>
            <DropdownMenuItem
              className='px-4 py-3 hover:bg-[#F5C731]/60 rounded-lg'
              onClick={handleTriggerFileInput}
            >
              <label htmlFor='fileUpload'>
                <button className='w-fit'>{t('uploadWithFile')}</button>
              </label>
            </DropdownMenuItem>
            <DropdownMenuItem
              className='px-4 py-3 hover:bg-[#F5C731]/60 rounded-lg'
              onClick={handleGoogleDriveUpload}
            >
              <div className='w-fit'>{t('uploadWithGoogleDrive')}</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* Dialog hiển thị sau khi chọn file hợp lệ */}
      <Dialog open={isDialogOpen}>
        <DialogContent className='p-4 w-fit'>
          <DialogHeader className='-mx-4 px-6 border-b border-b-[#D9D9D9] '>
            <DialogTitle>
              <div className='font-semibold pb-4'>{t('uploading')}</div>
            </DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            {isUploading && (
              <div className='flex items-center w-[416px] gap-2 pb-4'>
                <Image
                  src={'/PDF-file-type.png'}
                  alt='pdf'
                  width={100}
                  height={100}
                  className='w-6 h-6 m-[6px]'
                />
                <div className='flex-1 max-w-[416px] flex flex-col gap-1 mr-2'>
                  <p>{selectedFile?.name}</p>
                  <Progress
                    value={progress}
                    className='h-2 w-full bg-[#FFF5D4] [&>div]:bg-[#F5C731]'
                  />
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
