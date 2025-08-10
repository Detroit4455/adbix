'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { ArrowDownTrayIcon, QrCodeIcon } from '@heroicons/react/24/outline';

interface QRCodeGeneratorProps {
  url: string;
  logoUrl?: string;
  size?: number;
  businessName?: string;
}

export default function QRCodeGenerator({ 
  url, 
  logoUrl = '/favicon_io/android-chrome-512x512.png', 
  size = 400,
  businessName 
}: QRCodeGeneratorProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateQRCode = async () => {
    if (!url) return;
    
    setIsGenerating(true);
    try {
      // Generate QR code
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Calculate canvas dimensions - QR code + space for business name below
      const qrSize = size;
      const textHeight = businessName ? 60 : 0; // Space for business name
      const totalHeight = qrSize + textHeight;
      
      // Set canvas size
      canvas.width = qrSize;
      canvas.height = totalHeight;
      
      // Create a temporary canvas for QR code generation
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = qrSize;
      tempCanvas.height = qrSize;

      await QRCode.toCanvas(tempCanvas, url, {
        width: qrSize,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H' // High error correction to allow for logo overlay
      });

      // Get context for main canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Fill canvas with white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, qrSize, totalHeight);

      // Draw QR code on main canvas
      ctx.drawImage(tempCanvas, 0, 0);

      // Add logo overlay to QR code
      if (logoUrl) {
        const logo = new Image();
        logo.crossOrigin = 'anonymous';
        
        logo.onload = () => {
          // Calculate logo size (about 20% of QR code size)
          const logoSize = qrSize * 0.2;
          const logoX = (qrSize - logoSize) / 2;
          const logoY = (qrSize - logoSize) / 2;

          // Draw white background square for logo only
          const bgSize = logoSize + 16; // Logo size + padding
          const bgX = (qrSize - bgSize) / 2;
          const bgY = (qrSize - bgSize) / 2;
          
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(bgX, bgY, bgSize, bgSize);

          // Add subtle border to background
          ctx.strokeStyle = '#E5E7EB';
          ctx.lineWidth = 1;
          ctx.strokeRect(bgX, bgY, bgSize, bgSize);

          // Draw logo
          ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);

                     // Add business name text below QR code
           if (businessName) {
             const textY = qrSize + 35; // Position below QR code
             let fontSize = 18;
             
             // Adjust font size based on text length
             if (businessName.length > 15) fontSize = 16;
             if (businessName.length > 20) fontSize = 14;
             if (businessName.length > 25) fontSize = 12;
             
             ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
             ctx.fillStyle = '#1F2937';
             ctx.textAlign = 'center';
             ctx.textBaseline = 'middle';
             
             // Create the full text with "Visit To" prefix
             const fullText = `Visit To ${businessName}`;
             
             // Check if text fits in one line
             const maxTextWidth = qrSize - 40; // Some margin from edges
             const textMetrics = ctx.measureText(fullText);
             
             if (textMetrics.width > maxTextWidth) {
               // Split text into words and wrap
               const words = fullText.split(' ');
               const lines = [];
               let currentLine = '';
               
               for (const word of words) {
                 const testLine = currentLine + (currentLine ? ' ' : '') + word;
                 const testMetrics = ctx.measureText(testLine);
                 
                 if (testMetrics.width > maxTextWidth && currentLine) {
                   lines.push(currentLine);
                   currentLine = word;
                 } else {
                   currentLine = testLine;
                 }
               }
               if (currentLine) lines.push(currentLine);
               
               // Draw wrapped text
               lines.forEach((line, index) => {
                 const lineY = textY + (index - (lines.length - 1) / 2) * (fontSize + 4);
                 ctx.fillText(line, qrSize / 2, lineY);
               });
             } else {
               // Draw single line text
               ctx.fillText(fullText, qrSize / 2, textY);
             }
           }

          // Convert to high-quality data URL for download
          setQrCodeDataUrl(canvas.toDataURL('image/png', 1.0)); // Maximum quality
        };

                 logo.onerror = () => {
           // If logo fails to load, just add business name below QR code
           if (businessName) {
             const textY = qrSize + 35;
             let fontSize = 18;
             
             if (businessName.length > 15) fontSize = 16;
             if (businessName.length > 20) fontSize = 14;
             if (businessName.length > 25) fontSize = 12;
             
             ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
             ctx.fillStyle = '#1F2937';
             ctx.textAlign = 'center';
             ctx.textBaseline = 'middle';
             
             const fullText = `Visit To ${businessName}`;
             ctx.fillText(fullText, qrSize / 2, textY);
           }
           setQrCodeDataUrl(canvas.toDataURL('image/png', 1.0));
         };

        logo.src = logoUrl;
             } else {
         // No logo, but add business name below QR code if provided
         if (businessName) {
           const textY = qrSize + 35;
           let fontSize = 18;
           
           if (businessName.length > 15) fontSize = 16;
           if (businessName.length > 20) fontSize = 14;
           if (businessName.length > 25) fontSize = 12;
           
           ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
           ctx.fillStyle = '#1F2937';
           ctx.textAlign = 'center';
           ctx.textBaseline = 'middle';
           
           const fullText = `Visit To : ${businessName}`;
           ctx.fillText(fullText, qrSize / 2, textY);
         }
         setQrCodeDataUrl(canvas.toDataURL('image/png', 1.0));
       }
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return;

    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    const businessNameSlug = businessName ? businessName.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'website';
    link.download = `adbix-${businessNameSlug}-qr-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    generateQRCode();
  }, [url, logoUrl, size, businessName]);

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <QrCodeIcon className="h-6 w-6 text-indigo-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">QR Code</h3>
        </div>
        <button
          onClick={downloadQRCode}
          disabled={!qrCodeDataUrl || isGenerating}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
          Download
        </button>
      </div>

      <div className="text-center">
        {isGenerating ? (
          <div className="flex items-center justify-center" style={{ height: businessName ? '460px' : '400px' }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="inline-block p-4 bg-gray-50 rounded-lg">
            <canvas
              ref={canvasRef}
              style={{ maxWidth: '100%', height: 'auto' }}
              className="rounded-lg shadow-sm"
            />
          </div>
        )}
        
        <p className="text-sm text-gray-600 mt-3">
          Scan this QR code to access your website instantly
        </p>
        
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">QR Code for:</p>
          <code className="text-xs text-gray-700 font-mono break-all">
            {url}
          </code>
        </div>
      </div>
    </div>
  );
} 