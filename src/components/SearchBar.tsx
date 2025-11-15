'use client';

import React, { FormEvent, useRef, useState } from 'react';

interface SearchBarProps {
  onSearch: (address: string) => void;
  isLoading?: boolean;
  error?: string | null;
  retryAfter?: number; //Show countdown for rate limits
}

export function SearchBar({ onSearch, isLoading = false, error, retryAfter }: SearchBarProps) {
  const [address, setAddress] = useState('');
  const pendingSearchRef = useRef<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Countdown timer for rate limits
  React.useEffect(() => {
    if (retryAfter && retryAfter > 0) {
      setCountdown(retryAfter);

      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [retryAfter]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedAddress = address.trim();

    if (!trimmedAddress) {
      return;
    }

    // Prevent submission during rate limit cooldown
    if (countdown !== null && countdown > 0) {
      return;
    }

    if (!isLoading) {
      onSearch(trimmedAddress);
    }
  };

  const loadSampleAddress = () => {
    if (isLoading || (countdown !== null && countdown > 0)) return;

    const satoshiAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
    setAddress(satoshiAddress);
    pendingSearchRef.current = satoshiAddress;

    setTimeout(() => {
      if (pendingSearchRef.current === satoshiAddress && !isLoading) {
        onSearch(satoshiAddress);
        pendingSearchRef.current = null;
      }
    }, 0);
  };

  // Determine error type for better messaging
  const isRateLimitError =
    error?.toLowerCase().includes('too many requests') || error?.toLowerCase().includes('rate limit');

  return (
    <div className="w-full bg-white/80 dark:bg-slate-900/60 backdrop-blur-md py-4 px-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
      <form onSubmit={handleSubmit} className="flex items-center gap-4 max-w-[1400px] mx-auto">
        {/* Title */}
        <div className="flex-shrink-0">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">
            Bitcoin Transaction Explorer
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-400">Visualize transaction networks by address</p>
        </div>

        {/* Input field */}
        <div className="flex-1 flex items-center gap-3 bg-white dark:bg-slate-800 rounded-lg p-2 border border-slate-200 dark:border-slate-700 shadow-sm">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter Bitcoin address (e.g., 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa)"
            disabled={isLoading || (countdown !== null && countdown > 0)}
            className="flex-1 px-4 py-2 border-0 rounded-md focus:outline-none bg-transparent dark:text-white text-sm font-mono placeholder:text-slate-400 disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={isLoading || !address.trim() || (countdown !== null && countdown > 0)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-150 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Loading...
              </>
            ) : countdown !== null && countdown > 0 ? (
              `Wait ${countdown}s`
            ) : (
              'Explore'
            )}
          </button>
        </div>

        {/* Right actions */}
        <div className="flex-shrink-0 flex items-center gap-3">
          {/* Error messages with different styles */}
          {error && (
            <div
              className={`text-sm px-3 py-1 rounded-lg flex items-center gap-2 ${
                isRateLimitError
                  ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800'
                  : 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
              }`}
            >
              {isRateLimitError ? (
                <>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-xs">
                    {countdown !== null && countdown > 0 ? `Please wait ${countdown}s before trying again` : error}
                  </span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-xs">{error}</span>
                </>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={loadSampleAddress}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isLoading || (countdown !== null && countdown > 0)}
            aria-label="Fill sample Bitcoin address"
            title="Try Satoshi's first Bitcoin address"
          >
            <span aria-hidden>🧪</span>
            Try sample
          </button>
        </div>
      </form>

      {/* Helpful tip during rate limit */}
      {countdown !== null && countdown > 0 && (
        <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 max-w-[1400px] mx-auto flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            Rate limiting helps protect the blockchain API. Your request will be available in {countdown} seconds.
          </span>
        </div>
      )}
    </div>
  );
}
