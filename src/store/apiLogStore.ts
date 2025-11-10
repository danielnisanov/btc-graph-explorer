import { create } from 'zustand';

// Single API log entry
export interface ApiLogEntry {
  id: string; // Unique identifier for the log entry
  timestamp: Date; // When the request was made
  url: string; // Full URL that was requested
  method: string; // HTTP method (GET, POST, etc.)
  status?: number; // Response status code (200, 404, etc.)
  duration?: number; // Request duration in milliseconds
  error?: string; // Error message if request failed
  response?: unknown; // Response data (optional, can be large)
}

interface ApiLogState {
  logs: ApiLogEntry[]; // Array of all API calls
  isExpanded: boolean; // Whether the log window is open or collapsed
  maxLogs: number; // Maximum number of logs to keep (prevent memory issues)

  // Actions
  addLog: (log: Omit<ApiLogEntry, 'id' | 'timestamp'>) => void; // Add a new log entry
  clearLogs: () => void; // Clear all logs
  toggleExpanded: () => void; // Open/close the log window
  setExpanded: (expanded: boolean) => void; // Explicitly set expanded state
}

export const useApiLogStore = create<ApiLogState>((set) => ({
  logs: [],
  isExpanded: false,
  maxLogs: 100, // Keep last 100 logs

  addLog: (log) =>
    set((state) => {
      // Generate unique ID for this log entry
      const id = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create complete log entry with timestamp
      const newLog: ApiLogEntry = {
        ...log,
        id,
        timestamp: new Date(),
      };

      // Keep only the last maxLogs entries to prevent memory issues
      const updatedLogs = [...state.logs, newLog].slice(-state.maxLogs);

      return { logs: updatedLogs };
    }),

  clearLogs: () => set({ logs: [] }),

  toggleExpanded: () => set((state) => ({ isExpanded: !state.isExpanded })),

  setExpanded: (expanded) => set({ isExpanded: expanded }),
}));
