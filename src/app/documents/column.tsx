'use client';

import { FileMetadata } from '@/types/types';
import { Avatar, AvatarFallback } from '@radix-ui/react-avatar';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

export const columns: ColumnDef<FileMetadata>[] = [
  {
    accessorKey: 'name',
    header: ({}) => {
      return <span className='text-sm'>File name</span>;
    },
  },
  {
    accessorKey: 'ownerName',
    header: ({}) => {
      return <span className='text-sm'>Document owner</span>;
    },
    cell: ({ row }) => {
      return (
        <div className='flex items-center gap-2'>
          <div className='rounded-full w-10 h-10'>
            <Avatar className='w-full h-full rounded-full bg-[#F5C731] flex items-center justify-center'>
              <AvatarFallback className='text-xs font-medium text-gray-900'>
                {row.original.ownerName
                  .replace('(You)', '')
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
      return (
        <div className='flex w-fit text-sm'>
          Last updated
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
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
  },
];
