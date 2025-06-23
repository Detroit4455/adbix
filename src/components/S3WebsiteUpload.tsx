'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function S3WebsiteUpload() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [s3Url, setS3Url] = useState('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (status !== 'authenticated') {
      setError('Please log in to upload files');
      router.push('/login');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');
    setUploadProgress(0);
    setS3Url('');

    try {
      // Check if we have a ZIP file
      if (acceptedFiles.length === 0 || !acceptedFiles[0].name.endsWith('.zip')) {
        throw new Error('Please upload a valid ZIP file');
      }
      
      const formData = new FormData();
      formData.append('zipFile', acceptedFiles[0]);

      // Simulate progress for better UX
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 5;
        });
      }, 300);

      const response = await fetch('/api/s3-upload-zip', {
        method: 'POST',
        body: formData,
      });

      clearInterval(interval);
      setUploadProgress(100);

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          throw new Error('Please log in to upload files');
        }
        throw new Error(data.error || 'Failed to upload files');
      }

      setSuccess('Website uploaded successfully to S3!');
      if (data.s3Url) {
        setS3Url(data.s3Url);
      }
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('s3-upload-complete'));
      
      // Reset progress after 1 second
      setTimeout(() => {
        setUploadProgress(0);
      }, 1000);
      
      router.refresh(); // Refresh to update the UI
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload files');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  }, [status, router]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip'],
    },
    multiple: false,
  });

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="flex items-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <h2 className="text-lg font-bold text-gray-800">Upload Your Website to S3</h2>
      </div>
      
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all mb-5
          ${isDragActive 
            ? 'border-indigo-500 bg-indigo-50' 
            : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex flex-col items-center">
            <div className="w-full bg-gray-200 rounded-full h-2.5 my-4">
              <div 
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-gray-600 mt-1">Uploading ZIP archive... {uploadProgress}%</p>
          </div>
        ) : (
          <div>
            <div className="flex justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-gray-700 font-medium mb-2">
              {isDragActive
                ? "Drop your ZIP archive here"
                : "Drag and drop your website ZIP archive here"}
            </p>
            <p className="text-sm text-gray-500 mb-3">
              or click to select ZIP file
            </p>
            <button 
              type="button"
              className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              Select ZIP File
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 rounded-lg flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 rounded-lg flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {s3Url && (
        <div className="mt-4 p-5 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-medium text-blue-800 mb-2">Website Uploaded Successfully!</h3>
          <p className="mb-3 text-blue-700">Your website is now available at:</p>
          <div className="bg-white p-3 rounded-md flex items-center justify-between mb-3">
            <span className="text-gray-800 font-medium overflow-x-auto">{s3Url}</span>
            <a 
              href={s3Url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-3 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              Visit S3 Site
            </a>
          </div>
          <div className="bg-white p-3 rounded-md flex items-center justify-between">
            <span className="text-gray-800 font-medium overflow-x-auto">
              http://localhost:3000/site/{session?.user?.mobileNumber}/index.html
            </span>
            <a 
              href={`/site-viewer/${session?.user?.mobileNumber}?path=index.html`}
              className="ml-3 px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors whitespace-nowrap"
            >
              View In App
            </a>
          </div>
        </div>
      )}

      <div className="mt-6 border border-blue-100 bg-blue-50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Upload Requirements
        </h3>
        <ul className="space-y-2 text-sm text-blue-700">
          <li className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Your website ZIP file must contain an <code className="px-1 py-0.5 bg-blue-100 rounded text-blue-800 font-mono">index.html</code> file</span>
          </li>
          <li className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Files are stored on Amazon S3 under <code className="px-1 py-0.5 bg-blue-100 rounded text-blue-800 font-mono">sites/[mobileno]</code></span>
          </li>
          <li className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Use relative paths in your HTML files for assets (CSS, JS, images)</span>
          </li>
          <li className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Ensure your ZIP file is not password-protected or encrypted</span>
          </li>
        </ul>
      </div>
    </div>
  );
} 