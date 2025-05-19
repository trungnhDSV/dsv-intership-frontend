// components/error-toast.tsx
'use client';

import { AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';

interface ErrorToastProps {
  title: string;
  description: string;
  duration?: number;
}

export function showErrorToast({
  title,
  description,
  duration = 5000,
}: ErrorToastProps) {
  return toast.error(
    <div className="flex flex-col">
      <div className="flex items-center justify-between">
        <h3 className="text-[#900B09] font-semibold">{title}</h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toast.dismiss();
          }}
          className="text-[#900B09] hover:text-[#700707] ml-2"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="text-[#900B09] mt-1">{description}</p>
    </div>,
    {
      duration,
      className: 'custom-toast-icon-top custom-error-toast',
      icon: <AlertTriangle className="text-[#900B09] h-5 w-5 mr-3 mt-1" />,
    }
  );
}
