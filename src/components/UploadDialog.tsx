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

interface UploadDialogProps {
  session: Session | null;
  onUploadSuccess?: (newDocs: FileMetadata) => void;
}

export function UploadDialog({ session, onUploadSuccess }: UploadDialogProps) {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // handle trigger file input
  const handleTriggerFileInput = () => {
    if (!fileInputRef.current) return;
    fileInputRef.current.click();
  };

  // handle upload with Google Drive
  const handleGoogleDriveUpload = async () => {
    // 1. Nhận access token của Google từ session NextAuth
    const googleToken = session?.googleAccessToken; // Kiểm tra đúng property nhé!
    if (!googleToken) {
      showErrorToast({ title: 'Bạn cần đăng nhập Google!' });
      return;
    }

    console.log('Google token:', googleToken);

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
          // 4. Tạo file từ blob (để reuse logic)
          const file = new File([blob], picked.name, { type: blob.type });
          // 5. Gọi lại handleUpload (reuse)
          handleUpload(file);
        }
      })
      .build();
    picker.setVisible(true);
  };

  // Xử lý upload
  const handleUpload = async (file: File) => {
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
    console.log('CHECK PASS', await checkPdfPassword(file));
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
        const metaRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({
            name: file.name,
            s3Key,
            fileSize: file.size,
            fileType: file.type,
            ownerId: session!.user!.id,
          }),
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
      <div>
        {session?.googleAccessToken ? (
          <>
            <DropdownMenu
              dir='ltr'

              //  open={isOpen} onOpenChange={() => setIsOpen(!isOpen)}
            >
              <DropdownMenuTrigger asChild>
                <Button variant='primary' type='button' onClick={handleTriggerFileInput}>
                  <Image
                    src='/icon-upload.svg'
                    alt='upload'
                    width={16}
                    height={16}
                    className='mr-2'
                  />
                  Upload Document
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className='mt-3 mr-6 rounded-xl w-fit p-2 bg-white border-[1px] border-[#D9D9D9] z-10000'>
                <DropdownMenuItem
                  className='px-4 py-3 hover:bg-[#F5C731]/60 rounded-lg'
                  onClick={handleTriggerFileInput}
                >
                  <input
                    id='fileUpload'
                    ref={fileInputRef}
                    type='file'
                    accept='application/pdf'
                    className='hidden'
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        console.log('START HANDLE UPLOAD');
                        handleUpload(file);
                      }
                      e.target.value = '';
                    }}
                  />

                  <label htmlFor='fileUpload'>
                    <button className='w-fit'>Upload with File</button>
                  </label>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className='px-4 py-3 hover:bg-[#F5C731]/60 rounded-lg'
                  onClick={handleGoogleDriveUpload}
                >
                  <div className='w-fit'>Upload with Google Drive</div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <input
              id='fileUpload'
              ref={fileInputRef}
              type='file'
              accept='application/pdf'
              className='hidden'
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  console.log('START HANDLE UPLOAD');
                  handleUpload(file);
                }
                e.target.value = '';
              }}
            />

            <label htmlFor='fileUpload'>
              <Button variant='primary' type='button' onClick={handleTriggerFileInput}>
                <Image
                  src='/icon-upload.svg'
                  alt='upload'
                  width={16}
                  height={16}
                  className='mr-2'
                />
                Upload Document
              </Button>
            </label>
          </>
        )}
      </div>
      {/* Dialog hiển thị sau khi chọn file hợp lệ */}
      <Dialog open={isDialogOpen}>
        <DialogContent className='p-4 w-fit'>
          <DialogHeader className='-mx-4 px-6 border-b border-b-[#D9D9D9] '>
            <DialogTitle>
              <div className='font-semibold pb-4'>Uploading</div>
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
                <div className='flex-1 flex flex-col gap-1 mr-2'>
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
