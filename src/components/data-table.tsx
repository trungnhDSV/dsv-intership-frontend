'use client';

import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { FileMetadata } from '@/types/types';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  setAuthDialogData: (data: {
    fileName: string;
    uploaderEmail: string;
    currAccountEmail?: string;
    onSuccess?: (newAccId: string) => void;
  }) => void;
  setAuthDialogOpen: (open: boolean) => void;
  currUser:
    | {
        id: string;
        email: string;
        name: string;
      }
    | null
    | undefined;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  setAuthDialogData,
  setAuthDialogOpen,
  currUser,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  const router = useRouter();
  return (
    <div className='w-full h-full flex flex-col '>
      <div className='rounded-md'>
        <Table>
          <TableHeader className='bg-[#F5F5F5] h-10 sticky top-0 z-10 shadow-sm'>
            {table.getHeaderGroups().map((headerGroup) => {
              return (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        className={cn(
                          'px-4',
                          header.id === 'name' && 'w-full',
                          header.id === 'ownerName' && 'min-w-[280px]',
                          header.id === 'uploadAt' && 'w-fit'
                        )}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableHeader>
          <TableBody className=''>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                return (
                  <TableRow
                    className='px-4 h-18'
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    onClick={() => {
                      // @ts-expect-error: row.original type may not match FileMetadata due to generic typing
                      const data: FileMetadata = row.original;
                      if (data.googleDrive && data.ownerId === currUser?.id) {
                        // only require authorization if the file is from Google Drive and the uploader is owner
                        const currAccountData = JSON.parse(
                          localStorage.getItem('googleDriveProfile') || '{}'
                        );
                        if (!currAccountData.id) {
                          // Authorize
                          setAuthDialogData({
                            fileName: data.name,
                            uploaderEmail: data.googleDrive.email,
                            onSuccess: (newAccId) => {
                              if (data.googleDrive?.accountId === newAccId) {
                                router.push(`/documents/${data.id}`);
                              }
                            },
                          });
                          setAuthDialogOpen(true);
                          return;
                        }
                        if (currAccountData.id === data.googleDrive.accountId) {
                          router.push(`/documents/${data.id}`);
                        } else {
                          // Reauthorize with the correct account and redirect
                          setAuthDialogData({
                            fileName: data.name,
                            uploaderEmail: data.googleDrive.email,
                            currAccountEmail: currAccountData.email,
                            onSuccess: (newAccId) => {
                              if (newAccId === data.googleDrive?.accountId) {
                                router.push(`/documents/${data.id}`);
                              }
                            },
                          });
                          setAuthDialogOpen(true);
                          return;
                        }
                      } else router.push(`/documents/${(row.original as { id: string }).id}`);
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className='px-4 font-medium'>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
