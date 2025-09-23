'use client';

import { type FC, useEffect, useState } from 'react';
import { AlertTriangle, Copy, RotateCcw, X } from 'lucide-react';
import { clsx } from 'clsx';

export type NiceErrorProps = {
  title?: string;
  description?: string;
  /** unique id so parent can reset */
  id?: string;
  /** auto-hide after ms (0 = stay forever) */
  dismissAfter?: number;
  /** callback when user closes or timer finishes */
  onDismiss?: () => void;
  /** show raw error only in development */
  devOnly?: boolean;
};

export const NiceError: FC<NiceErrorProps> = ({
  title = 'Oops! Something went wrong.',
  description,
  id,
  dismissAfter = 0,
  onDismiss,
  devOnly = true,
}) => {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // trigger entrance animation
    requestAnimationFrame(() => setShow(true));

    if (!dismissAfter) return;
    const t = setTimeout(() => handleClose(), dismissAfter);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, dismissAfter]);

  const handleClose = () => {
    setShow(false);
    setTimeout(() => onDismiss?.(), 300); // wait for fade-out
  };

  const handleCopy = async () => {
    const text = description ?? 'Unknown error';
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div
      className={clsx(
        'pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-4 transition-opacity duration-300',
        show ? 'opacity-100' : 'opacity-0'
      )}
    >
      <div
        className={clsx(
          'pointer-events-auto flex w-full max-w-lg gap-4 rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-red-200',
          'animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300 ease-out',
          show && 'shake' // tailwindcss-animate utility
        )}
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>

          {/* message */}
          <p className="mt-1 text-sm text-gray-600">
            {description || 'Please try again or contact support if the problem persists.'}
          </p>

          {/* raw stack only in dev */}
          {devOnly && isDev && description && (
            <details className="mt-3 text-xs">
              <summary className="cursor-pointer text-gray-500">Technical details</summary>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-gray-100 p-2 text-red-800">
                {description}
              </pre>
            </details>
          )}

          {/* actions */}
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
            >
              <Copy className="h-4 w-4" />
              {copied ? 'Copied!' : 'Copy'}
            </button>

            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
            >
              <RotateCcw className="h-4 w-4" />
              Retry
            </button>

            <button
              onClick={handleClose}
              className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-sm text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50"
            >
              <X className="h-4 w-4" />
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};