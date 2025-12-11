import React, { Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import Loading from '../../../components/common/Loading';
import EmailTickets from '../../../components/tickets/EmailTickets';

export default function TlEmailTicketsPage(){
  const navigate = useNavigate();

  return (
    <div className="relative">
      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center p-8 max-w-md">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="relative bg-white dark:bg-slate-800 rounded-full p-6 shadow-2xl">
                <svg 
                  className="w-16 h-16 text-blue-600 dark:text-blue-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Feature Coming Soon
          </h2>

          {/* Description */}
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            We're working hard to bring you an amazing email experience. Stay tuned!
          </p>

          {/* Go Home Button */}
          <button
            onClick={() => navigate('/UTC/99810035')}
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 
              hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg 
              hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
              />
            </svg>
            Go to Home
          </button>

          {/* Decorative Elements */}
          <div className="mt-8 flex justify-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>

      {/* Original Content (Hidden but preserved for future use) */}
      <div className="opacity-0 pointer-events-none">
        <Suspense fallback={<Loading fullScreen size="lg" />}> 
          <EmailTickets />
        </Suspense>
      </div>
    </div>
  );
}
