'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

/**
 * A special page component that can view file content directly,
 * including files from blob URLs that might not download properly
 */
export default function ViewFilePage() {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    try {
      // Get URL parameters
      const params = new URLSearchParams(window.location.search);
      const url = params.get('url');
      const name = params.get('name') || 'File';
      
      if (!url) {
        setError('No file URL provided');
        return;
      }
      
      setFileUrl(url);
      setFileName(name);
      
      // Determine file type from extension or fallback to generic
      if (name) {
        const extension = name.split('.').pop()?.toLowerCase();
        if (extension) {
          switch (extension) {
            case 'pdf':
              setFileType('pdf');
              break;
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'webp':
              setFileType('image');
              break;
            case 'mp4':
            case 'webm':
            case 'ogg':
              setFileType('video');
              break;
            case 'mp3':
            case 'wav':
              setFileType('audio');
              break;
            default:
              setFileType('generic');
          }
        }
      }
    } catch (err) {
      console.error('Error parsing URL parameters:', err);
      setError('Failed to load file');
    }
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-[#0f0b1e] p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center text-white/90 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Link>
          
          {fileName && (
            <h1 className="text-xl font-semibold text-white">{fileName}</h1>
          )}
        </div>
        
        {/* Content area */}
        <div className="bg-indigo-900/20 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-indigo-800/30 min-h-[70vh]">
          {error ? (
            <div className="flex flex-col items-center justify-center p-10 text-center">
              <div className="text-red-400 text-xl mb-4">Error: {error}</div>
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition-colors"
              >
                Return to Dashboard
              </Link>
            </div>
          ) : !fileUrl ? (
            <div className="flex items-center justify-center p-10">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {fileType === 'pdf' && (
                <iframe 
                  src={fileUrl} 
                  className="w-full h-[80vh]" 
                  title={fileName || 'PDF Document'}
                />
              )}
              
              {fileType === 'image' && (
                <img 
                  src={fileUrl} 
                  alt={fileName || 'Image'} 
                  className="max-w-full max-h-[80vh] object-contain"
                />
              )}
              
              {fileType === 'video' && (
                <video 
                  src={fileUrl} 
                  controls 
                  className="max-w-full max-h-[80vh]"
                />
              )}
              
              {fileType === 'audio' && (
                <audio 
                  src={fileUrl} 
                  controls 
                  className="w-full max-w-md"
                />
              )}
              
              {(fileType === 'generic' || !fileType) && (
                <div className="text-center p-8">
                  <p className="text-white mb-6">This file type may not be viewable directly in the browser.</p>
                  <a 
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition-colors inline-block"
                  >
                    Open File
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 