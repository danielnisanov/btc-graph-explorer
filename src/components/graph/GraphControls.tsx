import React from 'react';

interface GraphControlsProps {
  onFit: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCenter: () => void;
}

/**
 * Graph control buttons for zoom, fit, and center operations
 * Provides user controls for graph navigation
 */
export function GraphControls({ onFit, onZoomIn, onZoomOut, onCenter }: GraphControlsProps) {
  return (
    <div className="absolute top-4 right-4 bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-lg shadow-xl p-2 space-y-1">
      {/* Fit to screen button */}
      <button
        onClick={onFit}
        className="w-full px-3 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors font-medium flex items-center justify-center gap-2"
        title="Fit to screen"
        aria-label="Fit graph to screen"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
          />
        </svg>
        Fit
      </button>

      {/* Zoom in button */}
      <button
        onClick={onZoomIn}
        className="w-full px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-colors font-medium flex items-center justify-center gap-2"
        title="Zoom in"
        aria-label="Zoom in"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
          />
        </svg>
        Zoom In
      </button>

      {/* Zoom out button */}
      <button
        onClick={onZoomOut}
        className="w-full px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-colors font-medium flex items-center justify-center gap-2"
        title="Zoom out"
        aria-label="Zoom out"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
          />
        </svg>
        Zoom Out
      </button>

      {/* Center view button */}
      <button
        onClick={onCenter}
        className="w-full px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-colors font-medium flex items-center justify-center gap-2"
        title="Center view"
        aria-label="Center view"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
        Center
      </button>
    </div>
  );
}
