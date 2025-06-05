'use client';

import { FileMetadata } from '@/types/types';
import { Avatar, AvatarFallback } from '@radix-ui/react-avatar';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

export const columns: ColumnDef<FileMetadata>[] = [
  {
    accessorKey: 'name',
    header: () => {
      const t = useTranslations('documents');
      return <span className='text-sm'>{t('fileName')}</span>;
    },
  },
  {
    accessorKey: 'ownerName',
    header: () => {
      const t = useTranslations('documents');
      return <span className='text-sm'>{t('owner')}</span>;
    },
    cell: ({ row }) => {
      return (
        <div className='flex items-center gap-2'>
          <div className='rounded-full w-10 h-10'>
            <Avatar className='w-full h-full rounded-full bg-[#F5C731] flex items-center justify-center'>
              <AvatarFallback className='text-xs font-medium text-gray-900'>
                {row.original.ownerName
                  .replace('(You)', '')
                  .replace('(Bạn)', '')
                  .split(' ')
                  .map((n) => n[0])}
              </AvatarFallback>
            </Avatar>
          </div>

          <span className='text-sm'>{row.original.ownerName}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'uploadedAt',

    header: ({ column }) => {
      const t = useTranslations('documents');
      return (
        <div className='flex w-fit text-sm'>
          {t('lastUpdated')}
          <button
            onClick={() => {
              console.log('Sorting by date');
              column.toggleSorting(column.getIsSorted() === 'asc');
            }}
            className='cursor-pointer'
          >
            <ArrowUpDown className='ml-2 h-4 w-4' />
          </button>
        </div>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.original.uploadedAt);
      return (
        <div className='flex flex-col'>
          <span className='text-[#1E1E1E]'>
            {date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <span className='text-sm text-[#757575]'>
            {date
              .toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
              })
              .replace(' ', '')}
          </span>
        </div>
      );
    },
    sortingFn: (rowA, rowB) => {
      const dateA = new Date(rowA.original.uploadedAt).getTime();
      const dateB = new Date(rowB.original.uploadedAt).getTime();
      return dateA - dateB;
    },
  },
];
