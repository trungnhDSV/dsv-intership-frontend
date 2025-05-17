"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type AppDocument = {
  id: string;
  fileName: string;
  owner: string;
  avatar: string;
  updatedDate: string;
  // status: "pending" | "processing" | "success" | "failed";
};

export const columns: ColumnDef<AppDocument>[] = [
  {
    accessorKey: "fileName",
    header: "File name",
  },
  {
    accessorKey: "owner",
    header: "Document owner",
  },
  {
    accessorKey: "updatedDate",

    header: ({ column }) => {
      return (
        <div className="flex">
          Last updated
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="cursor-pointer"
          >
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </button>
        </div>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.original.updatedDate);
      return (
        <span className="text-sm text-gray-500">
          {date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
      );
    },
  },
];
