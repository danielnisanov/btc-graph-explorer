'use client';

import { FormEvent, useState } from 'react';

interface SearchBarProps {
  onSearch: (address: string) => void; // Callback when user submits an address
  isLoading?: boolean; // Show loading state
  error?: string | null; // Display error message if any
}
export function SearchBar({ onSearch, isLoading = false, error }: SearchBarProps) {
  // Local state for the input field
  const [address, setAddress] = useState('');
  /**
   * Handle form submission
   * Validates and calls onSearch callback
   */
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault(); // Prevent page reload

    //Trim whitespace from input
    const trimmedAddress = address.trim();

    // Basic validation
    if (!trimmedAddress) {
      // alert('Please enter a Bitcoin address');
      return;
    }
    // Call the onSearch callback with the entered address
    onSearch(trimmedAddress);
  };

  /* Load a sample address for testing
   * This is Satoshi's address - the first Bitcoin address ever
   */
  const loadSampleAddress = () => {
    const satoshiAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
    setAddress(satoshiAddress);
    onSearch(satoshiAddress);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Bitcoin Transaction Explorer</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Enter a Bitcoin address to visualize its transaction network
          </p>
        </div>

        {/* Input field */}
        <div className="flex gap-2">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter Bitcoin address (e.g., 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa)"
            disabled={isLoading}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm font-mono"
          />

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading || !address.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
              </span>
            ) : (
              'Explore'
            )}
          </button>
        </div>

        {/* Sample button */}
        <div className="text-center">
          <button
            type="button"
            onClick={loadSampleAddress}
            disabled={isLoading}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline disabled:text-gray-400"
          >
            Try Satoshi&apos;s address (first Bitcoin address)
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error loading address</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Info box */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>💡 Tip:</strong> Click on any node in the graph to expand and see its connections. Only the first 10
            transactions are loaded initially for better performance.
          </p>
        </div>
      </form>
    </div>
  );
}
