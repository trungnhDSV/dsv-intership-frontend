"use client";

import { useState, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { showErrorToast, showSuccessToast } from "@/components/CustomToast";
import { MAX_SIZE } from "@/constants/UI";
import { checkPdfPassword } from "@/lib/pdf-util";
import { Session } from "next-auth";
import { toast } from "sonner";
import { AppDocument } from "@/app/documents/column";

interface UploadDialogProps {
  session: Session | null;
  onUploadSuccess?: (newDocs: AppDocument) => void;
}

export function UploadDialog({ session, onUploadSuccess }: UploadDialogProps) {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Xử lý khi chọn file
  const handleButtonClick = () => {
    console.log("CLICKING file input");
    if (!fileInputRef.current) return;
    fileInputRef.current.click();
  };

  // Xử lý upload
  const handleUpload = async (file: File) => {
    setSelectedFile(file);

    if (!file || !session?.user?.id) {
      console.error("No file selected or user ID not found");
      console.log(session);
      console.log(file);
      return;
    }
    console.log("CHECKING file:", file);
    if (file.size > MAX_SIZE) {
      showErrorToast({
        title: "Cannot Upload This File",
        description:
          "Please ensure the upload file is not more than 20MB and in .pdf format",
      });
      return;
    }

    console.log("CHECKING password");
    const hasPassword = await checkPdfPassword(file);
    if (hasPassword) {
      showErrorToast({
        title: "Cannot Upload This File",
        description: "Please ensure the upload file does not require password",
      });
      return;
    }
    console.log("Start uploading file:", file);

    setIsDialogOpen(true);
    setIsUploading(true);
    setProgress(0);

    // Step 1: Request upload URL
    console.log("FETCHING " + `${process.env.NEXT_PUBLIC_API_URL}/upload-url`);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        userId: session.user.id,
      }),
    });
    console.log("Request upload URL response:", res);
    const data: {
      data: {
        url: string;
        s3Key: string;
      };
    } = await res.json();
    const { url, s3Key } = data.data;

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setProgress(percent);
      }
    });

    xhr.addEventListener("load", () => {
      setIsUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        showSuccessToast({
          title: "Uploaded successfully",
        });
        setIsDialogOpen(false);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input
      } else {
        toast.error("Uploaded Fail!");
      }
    });

    xhr.addEventListener("error", () => {
      setIsUploading(false);
      toast.error("Lỗi kết nối!");
    });

    xhr.open("PUT", url, true);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);

    // Step 3: Save metadata to backend
    const metaRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/documents`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          s3Key,
          fileSize: file.size,
          fileType: file.type,
          ownerId: session.user.id,
        }),
      }
    );
    const result = await metaRes.json();
    console.log("✅ Document saved:", result);
    if (onUploadSuccess && result?.data) {
      onUploadSuccess(result.data); // result.data là document mới
    }
  };

  return (
    <>
      <div>
        <input
          id="fileUpload"
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              console.log("START HANDLE UPLOAD");
              handleUpload(file);
            }
            e.target.value = "";
          }}
        />

        <label htmlFor="fileUpload">
          <Button variant="primary" type="button" onClick={handleButtonClick}>
            <Image
              src="/icon-upload.svg"
              alt="upload"
              width={16}
              height={16}
              className="mr-2"
            />
            Upload Document
          </Button>
        </label>
      </div>
      {/* Dialog hiển thị sau khi chọn file hợp lệ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="p-4 w-fit">
          <DialogHeader className="-mx-4 px-6 border-b border-b-[#D9D9D9] ">
            <DialogTitle>
              <div className="font-semibold pb-4">Uploading</div>
            </DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {isUploading && (
              <div className="flex items-center w-[416px] gap-2 pb-4">
                <Image
                  src={"/PDF-file-type.png"}
                  alt="pdf"
                  width={100}
                  height={100}
                  className="w-6 h-6 m-[6px]"
                />
                <div className="flex-1 flex flex-col gap-1 mr-2">
                  <p>{selectedFile?.name}</p>
                  <Progress
                    value={progress}
                    className="h-2 w-full bg-[#FFF5D4] [&>div]:bg-[#F5C731]"
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
