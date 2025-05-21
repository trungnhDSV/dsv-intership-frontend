// components/error-toast.tsx
'use client';

import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';

interface ToastProps {
  title: string;
  description?: string;
  duration?: number;
}

const ToastCloseButton = ({ color }: { color: string }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      toast.dismiss();
    }}
    className={`text-${color} hover:text-${color}/80 ml-2`}
  >
    <X className='h-4 w-4' />
  </button>
);

export function showErrorToast({
  title,
  description,
  duration = 5000,
}: ToastProps) {
  return toast.error(
    <div className='flex flex-col'>
      <div className='flex items-center justify-between'>
        <h3 className='text-[#900B09] font-semibold'>{title}</h3>
        <ToastCloseButton color='#900B09' />
      </div>
      <p className='text-[#900B09] mt-1'>{description}</p>
    </div>,
    {
      duration,
      className: 'custom-toast-icon-top custom-error-toast',
      icon: <AlertTriangle className='text-[#900B09] h-5 w-5 mr-3 mt-1' />,
    }
  );
}

export function showSuccessToast({
  title,
  description,
  duration = 5000,
}: ToastProps) {
  return toast.success(
    <div className='toast-content-wrapper flex flex-col'>
      <div className='flex items-center justify-between w-full'>
        <h3 className='text-[#02542D] font-semibold flex-1'>{title}</h3>
        <ToastCloseButton color='#02542D' />
      </div>
      {description && <p className='text-[#02542D] mt-1'>{description}</p>}
    </div>,
    {
      duration,
      className: 'custom-toast-icon-top custom-success-toast',
      icon: <CheckCircle className='text-[#024023] h-5 w-5 mr-3 mt-1' />,
    }
  );
}
