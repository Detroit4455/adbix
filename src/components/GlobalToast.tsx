import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

let setToast: ((msg: string) => void) | null = null;

export function showGlobalToast(message: string, duration = 2000) {
  if (setToast) setToast(message);
  setTimeout(() => {
    if (setToast) setToast('');
  }, duration);
}

const GlobalToast: React.FC = () => {
  const [msg, setMsg] = useState('');
  useEffect(() => {
    setToast = setMsg;
    return () => {
      setToast = null;
    };
  }, []);
  if (!msg) return null;
  return createPortal(
    <div className="fixed left-4 top-4 z-[9999] bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      <span>{msg}</span>
    </div>,
    document.body
  );
};

export default GlobalToast; 