'use client';

import { useState } from 'react';

import { useApiLogStore } from '@/store/apiLogStore';

import type { ApiLogEntry } from '@/store/apiLogStore';

export function ApiLogWindow() {
  const logs = useApiLogStore((state) => state.logs);
  const isExpanded = useApiLogStore((state) => state.isExpanded);
  const toggleExpanded = useApiLogStore((state) => state.toggleExpanded);
  const clearLogs = useApiLogStore((state) => state.clearLogs);
  const [selectedLog, setSelectedLog] = useState<string | null>(null);

  /**
   * Get error message as string
   */
  const getErrorMessage = (error?: string | Error): string => {
    if (!error) return '';
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    return String(error);
  };

  /**
   * Format timestamp to readable string
   */
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  /**
   * Get status color based on HTTP status code
   */
  const getStatusColor = (status?: number, error?: string | Error) => {
    if (error) return 'red';
    if (!status) return 'gray';
    if (status >= 200 && status < 300) return 'green';
    if (status >= 400) return 'orange';
    return 'yellow';
  };

  /**
   * Get status badge text
   */
  const getStatusText = (log: ApiLogEntry) => {
    if (log.error) return 'Error';
    if (log.status) return log.status.toString();
    return 'Pending';
  };

  /**
   * Shorten URL for display
   */

  const shortenUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname + urlObj.search;
      if (path.length > 50) {
        return path.slice(0, 47) + '...';
      }
      return path;
    } catch {
      return url.length > 50 ? url.slice(0, 47) + '...' : url;
    }
  };

  // If collapsed, show minimal tab
  if (!isExpanded) {
    return (
      <div className="fixed bottom-0 right-4 z-50">
        <button
          onClick={toggleExpanded}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-t-lg shadow-lg hover:bg-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="text-sm font-medium">API Logs</span>
          {logs.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">{logs.length}</span>
          )}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>
    );
  }

  // Expanded view
  return (
    <div className="fixed bottom-4 right-4 z-50 w-[520px] max-h-[420px] bg-white dark:bg-gray-800 rounded-t-lg shadow-2xl border-t-2 border-indigo-600 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-t-lg">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">API Call Log</h3>
          <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
            {logs.length} {logs.length === 1 ? 'call' : 'calls'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Clear button */}
          {logs.length > 0 && (
            <button
              onClick={clearLogs}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              title="Clear all logs"
            >
              Clear
            </button>
          )}

          {/* Collapse button */}
          <button
            onClick={toggleExpanded}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Collapse log window"
          >
            <svg
              className="w-5 h-5 text-gray-600 dark:text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-y-auto">
        {logs.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-sm">No API calls logged yet</p>
            <p className="text-xs mt-1">Search for a Bitcoin address to see API activity</p>
          </div>
        ) : (
          // Log list
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {[...logs].reverse().map((log) => (
              <div
                key={log.id}
                className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
                  selectedLog === log.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
                onClick={() => setSelectedLog(selectedLog === log.id ? null : log.id)}
              >
                {/* Log header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Method and URL */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded">
                        {log.method}
                      </span>
                      <span className="text-sm font-mono text-gray-700 dark:text-gray-300 truncate" title={log.url}>
                        {shortenUrl(log.url)}
                      </span>
                    </div>

                    {/* Time */}
                    <div className="text-xs text-gray-500 dark:text-gray-400">{formatTime(log.timestamp)}</div>
                  </div>

                  {/* Status and duration */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {log.duration !== undefined && (
                      <span className="text-xs text-gray-600 dark:text-gray-400">{log.duration}ms</span>
                    )}
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(log.status, log.error)}`}
                    >
                      {getStatusText(log)}
                    </span>
                  </div>
                </div>
                {log.error ? (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
                    <span className="font-semibold">Error:</span> {getErrorMessage(log.error)}
                  </div>
                ) : null}
                {selectedLog === log.id && log.response ? (
                  <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded">
                    <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Response:</div>
                    <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
                      {JSON.stringify(log.response, null, 2)}
                    </pre>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with stats */}
      {logs.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <span>✅ Success: {logs.filter((l) => l.status && l.status >= 200 && l.status < 300).length}</span>
              <span>❌ Failed: {logs.filter((l) => l.error || (l.status && l.status >= 400)).length}</span>
            </div>
            <div>
              {`Avg duration: ${logs.filter((l) => l.duration).length > 0
                  ? Math.round(
                      logs.reduce((sum, l) => sum + (l.duration || 0), 0) / logs.filter((l) => l.duration).length
                    )
                  : 0
              } ms`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
