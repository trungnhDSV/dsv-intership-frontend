"use client";
import { AppDocument, columns } from "@/app/documents/column";
import { DataTable } from "@/components/data-table";
import { useSession } from "next-auth/react";
import Image from "next/image";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { UploadDialog } from "@/components/UploadDialog";

function sortByDate(data: AppDocument[], direction: "asc" | "desc") {
  return [...data].sort((a, b) => {
    const dateA = new Date(a.uploadedAt).getTime();
    const dateB = new Date(b.uploadedAt).getTime();
    return direction === "asc" ? dateA - dateB : dateB - dateA;
  });
}

const DocsPage = () => {
  const { data: session, status } = useSession();
  const handleNewDocument = (newDoc: AppDocument) => {
    setDocuments((prev) => [newDoc, ...prev]); // thêm vào đầu danh sách
  };

  const [documents, setDocuments] = useState<AppDocument[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const LIMIT = 10;

  const loadMoreDocuments = useCallback(async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/documents?limit=${LIMIT}&offset=${offset}&sortOrder=${sortOrder}`
    );
    const data: {
      data: { documents: AppDocument[]; total: number };
    } = await res.json();
    const { documents: newDocs, total } = data.data;

    setDocuments((prev) => [...prev, ...newDocs]);
    setOffset((prevOffset) => {
      const newOffset = prevOffset + newDocs.length;
      setHasMore(newOffset < total);
      return newOffset;
    });
  }, [offset, sortOrder]);

  // lazy loading
  const loaderRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!loaderRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMoreDocuments();
      },
      { threshold: 1 }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loaderRef, hasMore, sortOrder, loadMoreDocuments]);

  // initial load and change sort order
  useEffect(() => {
    if (!session?.user) return;
    const fetchSorted = async () => {
      setDocuments([]);
      setOffset(0);
      setHasMore(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/documents?ownerId=${session?.user?.id}&limit=${LIMIT}&offset=0&sortOrder=${sortOrder}`
      );
      const data = await res.json();
      console.log("data: ", data);
      if (!data.data) return;
      const { documents: newDocs, total } = data.data;

      setDocuments(newDocs);
      setOffset(newDocs.length);
      setHasMore(newDocs.length < total);
    };

    fetchSorted();
  }, [sortOrder, session?.user]);

  if (status === "loading") return null;

  return (
    <div className="px-6 py-6 w-full flex flex-col h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] gap-6 ">
      <div className="flex justify-between">
        <div className="flex items-center">
          <p className="text-2xl font-semibold tracking-tight pr-3">
            My Documents
          </p>
          {documents.length > 0 ? (
            <div className="text-[#757575] text-sm pl-3 border-l-2 border-[#E3E8EF]">
              Total {documents.length}
            </div>
          ) : null}
        </div>
        {documents.length > 0 && (
          <UploadDialog session={session} onUploadSuccess={handleNewDocument} />
        )}
      </div>
      <div className="h-full w-full flex border-[1px] border-[#D9D9D9] rounded-[12px] overflow-hidden">
        {documents.length > 0 ? (
          <Documents
            data={documents}
            currUser={session?.user?.name as string}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-fit h-full flex flex-col justify-center">
              <div className="flex flex-col items-center justify-center gap-6 w-fit h-fit">
                <Image
                  src="/files-empty.png"
                  alt="empty"
                  width={192}
                  height={192}
                />
                <p className="text-[#4B5565]">There is no document founded</p>
                <UploadDialog
                  session={session}
                  onUploadSuccess={handleNewDocument}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Documents = ({
  data,
  currUser,
}: {
  data: AppDocument[];
  currUser: string;
}) => {
  if (!data) {
    return <>Loading</>;
  }
  console.log(currUser);
  const afterHandleData: AppDocument[] = data.map((doc) => {
    const ownerName =
      doc.ownerName === currUser ? `${doc.ownerName} (You)` : doc.ownerName;
    return {
      id: doc.id,
      name: doc.name,
      fileSize: doc.fileSize,
      ownerId: doc.ownerId,
      ownerName: ownerName,
      // avatar: doc.ownerAvatar,
      uploadedAt: doc.uploadedAt,
    };
  });
  return (
    <div className="flex-1">
      <DataTable<AppDocument, unknown>
        columns={columns}
        data={afterHandleData}
      />
    </div>
  );
};

export default DocsPage;
