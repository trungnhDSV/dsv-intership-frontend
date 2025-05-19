'use client';
import { pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;

export async function checkPdfPassword(
  file: File | Blob | ArrayBuffer
): Promise<boolean> {
  const data = file instanceof ArrayBuffer ? file : await file.arrayBuffer();
  try {
    await pdfjs.getDocument({ data }).promise;
    return false;
  } catch (err: any) {
    if (err?.name === 'PasswordException') return true;
    throw err;
  }
}
