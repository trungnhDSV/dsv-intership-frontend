"use client";
import { AppDocument } from "@/app/documents/column";
import { Document, Page, pdfjs } from "react-pdf";

import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Share,
} from "lucide-react";
import { Button } from "@/components/ui/button";
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;

const DocPage = () => {
  const { id } = useParams();
  const [doc, setDoc] = useState<AppDocument | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageInput, setPageInput] = useState<string>("");

  useEffect(() => {
    if (!id) return;
    console.log("Fetching document with id:", id);
    const fetchDoc = async () => {
      try {
        const s3KeyRes = await fetch(
          process.env.NEXT_PUBLIC_API_URL + `/documents/${id}`
        );
        const docData = await s3KeyRes.json();
        console.log("Document data:", docData);
        setDoc(docData.data);

        const urlRes = await fetch(
          process.env.NEXT_PUBLIC_API_URL +
            `/documents/presign?s3Key=${docData.data.s3Key}`
        );
        const urlData = await urlRes.json();
        console.log("Presigned URL data:", urlData);
        setUrl(urlData.data.url);
      } catch (error) {
        console.error("Error fetching document:", error);
        return;
      }
    };

    fetchDoc();
  }, [id]);

  const goToFirstPage = () => {
    setCurrentPage(1);
  };
  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };
  const goToNextPage = () => {
    if (numPages) {
      setCurrentPage((prev) => Math.min(prev + 1, numPages));
    }
  };
  const goToLastPage = () => {
    if (numPages) {
      setCurrentPage(numPages);
    }
  };
  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };
  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!numPages) return;

      const pageNum = parseInt(pageInput);
      if (!isNaN(pageNum)) {
        const validPage = Math.max(1, Math.min(pageNum, numPages));
        setCurrentPage(validPage);
        setPageInput(validPage.toString());
        e.currentTarget.blur();
      }
    }
  };

  return (
    <div className="pt-6 pb-4 px-6 w-full flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="p-5 mr-3">
            <ArrowLeft className="h-5 w-5" />
          </div>
          <p className="font-semibold text-2xl">{doc?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="w-fit bg-[#E3E3E3] border-[#767676]"
          >
            <Download />
            Download
          </Button>
          <Button
            variant="outline"
            className="w-fit bg-[#E3E3E3] border-[#767676]"
          >
            <Share />
            Share
          </Button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-[#F5F5F5]">
        <Document
          className={"w-[616px] h-full pt-6"}
          file={url} // presigned S3 URL
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        >
          <Page pageNumber={currentPage} />
        </Document>
      </div>
      {/* Navigation controls */}
      <div className="flex items-center justify-center gap-2 py-4 bg-white border-t">
        <Button
          variant="ghost"
          onClick={goToFirstPage}
          disabled={currentPage <= 1}
          className="p-2!"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          onClick={goToPreviousPage}
          disabled={currentPage <= 1}
          className="p-2!"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={pageInput}
            onChange={handlePageInputChange}
            onKeyDown={handlePageInputKeyDown}
            className="w-14 py-1 border rounded text-sm text-center"
          />
          <span className="text-sm text-[#757575]">/{numPages}</span>
        </div>

        <Button
          variant="ghost"
          onClick={goToNextPage}
          disabled={!numPages || currentPage >= numPages}
          className="p-2!"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          onClick={goToLastPage}
          disabled={!numPages || currentPage >= numPages}
          className="p-2!"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default DocPage;
