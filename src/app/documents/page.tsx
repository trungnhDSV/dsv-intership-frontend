'use client';
import { AppDocument, columns } from '@/app/documents/column';
import { DataTable } from '@/components/data-table';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { UploadDialog } from '@/components/UploadDialog';

const MOCK_DATA_INIT: AppDocument[] = [
  {
    id: 'doc-1',
    fileName: 'Letter of Acceptance of Payment Plan',
    owner: 'Elton Le (You)',
    avatar: '/avatars/elton.png',
    updatedDate: '2025-12-22T05:06:07Z',
  },
  {
    id: 'doc-2',
    fileName: 'Notice of Default on Settlement Offer',
    owner: 'Savannah Nguyen',
    avatar: '/avatars/savannah.png',
    updatedDate: '2024-11-14T12:06:07Z',
  },
  {
    id: 'doc-3',
    fileName: 'Motion to Compel Discovery',
    owner: 'Jacob Jones',
    avatar: '/avatars/jacob.png',
    updatedDate: '2024-10-22T08:06:07Z',
  },
  {
    id: 'doc-4',
    fileName: 'Notice of Intent to File Suit',
    owner: 'Jane Cooper',
    avatar: '/avatars/jane.png',
    updatedDate: '2024-08-22T17:06:07Z',
  },
  {
    id: 'doc-5',
    fileName: 'Notice of Termination of Payment Plan',
    owner: 'Esther Howard',
    avatar: '/avatars/esther.png',
    updatedDate: '2024-06-22T17:06:07Z',
  },
  {
    id: 'doc-6',
    fileName: 'Writ of Execution',
    owner: 'Cameron Williamson',
    avatar: '/avatars/cameron.png',
    updatedDate: '2024-06-22T08:06:07Z',
  },
  {
    id: 'doc-7',
    fileName: 'Compliance Report',
    owner: 'Floyd Miles',
    avatar: '/avatars/floyd.png',
    updatedDate: '2024-06-22T17:06:07Z',
  },
  {
    id: 'doc-8',
    fileName: 'Answer to Complaint',
    owner: 'Eleanor Pena',
    avatar: '/avatars/eleanor.png',
    updatedDate: '2024-06-22T17:06:07Z',
  },
  {
    id: 'doc-9',
    fileName: 'Motion for Summary Judgment',
    owner: 'Darlene Robertson',
    avatar: '/avatars/darlene.png',
    updatedDate: '2024-06-22T17:06:07Z',
  },
  {
    id: 'doc-10',
    fileName: 'Settlement Agreement',
    owner: 'Marvin McKinney',
    avatar: '/avatars/marvin.png',
    updatedDate: '2024-06-22T17:06:07Z',
  },
  {
    id: 'doc-11',
    fileName: 'Notice of Appeal',
    owner: 'Jerome Bell',
    avatar: '/avatars/jerome.png',
    updatedDate: '2024-06-22T17:06:07Z',
  },
  {
    id: 'doc-12',
    fileName: 'Motion to Dismiss',
    owner: 'Kristin Watson',
    avatar: '/avatars/kristin.png',
    updatedDate: '2024-06-22T17:06:07Z',
  },
  {
    id: 'doc-13',
    fileName: 'Request for Production of Documents',
    owner: 'Ronald Richards',
    avatar: '/avatars/ronald.png',
    updatedDate: '2024-06-22T17:06:07Z',
  },
  {
    id: 'doc-14',
    fileName: 'Subpoena Duces Tecum',
    owner: 'Cody Fisher',
    avatar: '/avatars/cody.png',
    updatedDate: '2024-06-22T17:06:07Z',
  },
  {
    id: 'doc-15',
    fileName: 'Motion for Protective Order',
    owner: 'Albert Flores',
    avatar: '/avatars/albert.png',
    updatedDate: '2024-06-22T17:06:07Z',
  },
];

function sortByDate(data: AppDocument[], direction: 'asc' | 'desc') {
  return [...data].sort((a, b) => {
    const dateA = new Date(a.updatedDate).getTime();
    const dateB = new Date(b.updatedDate).getTime();
    return direction === 'asc' ? dateA - dateB : dateB - dateA;
  });
}

const DocsPage = () => {
  const MOCK_DATA = MOCK_DATA_INIT;
  const { data: session, status } = useSession();

  const router = useRouter();
  useEffect(() => {
    console.log('status in DocsPage', status);
    console.log('session in DocsPage', session);

    if (status === 'unauthenticated') {
      console.log('NAVIGATE FROM DOCUMENTS TO SIGNIN');
      router.push('/sign-in');
    }
  }, [status, router, session]);
  const [columnsData, setColumnsData] = useState<AppDocument[]>([]);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    async function fetchForUI() {
      const raw = await getData(MOCK_DATA);
      const sorted = sortByDate(raw, sortDirection);
      setColumnsData(sorted);
    }
    fetchForUI();
  }, [sortDirection, MOCK_DATA]);

  if (status === 'loading') return null;

  return (
    <div className="px-6 py-6 w-full flex flex-col h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] gap-6 ">
      <div className="flex justify-between">
        <div className="flex items-center">
          <p className="text-2xl font-semibold tracking-tight pr-3">
            My Documents
          </p>
          {MOCK_DATA.length > 0 ? (
            <div className="text-[#757575] text-sm pl-3 border-l-2 border-[#E3E8EF]">
              Total {MOCK_DATA.length}
            </div>
          ) : null}
        </div>
        <UploadDialog session={session} />
      </div>
      <div className="h-full w-full flex border-[1px] border-[#D9D9D9] rounded-[12px] overflow-hidden">
        {MOCK_DATA.length > 0 ? (
          <Documents data={columnsData} />
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
                <UploadDialog session={session} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Documents = ({ data }: { data: AppDocument[] }) => {
  if (!data || data.length === 0) {
    return <>Loading</>;
  }
  return (
    <div className="flex-1">
      <DataTable columns={columns} data={data} />
    </div>
  );
};

async function getData(data: AppDocument[]): Promise<AppDocument[]> {
  // Fetch data from your API here.
  return data.map((doc) => ({
    id: doc.id,
    fileName: doc.fileName,
    owner: doc.owner,
    avatar: doc.avatar,
    updatedDate: new Date(doc.updatedDate).toISOString(),
  }));
}

export default DocsPage;
