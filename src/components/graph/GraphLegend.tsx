// src/components/graph/GraphLegend.tsx - Legend for graph node states

interface GraphLegendProps {
  className?: string;
}

export function GraphLegend({ className = '' }: GraphLegendProps) {
  return (
    <div
      className={`absolute bottom-4 left-4 bg-white/80 dark:bg-slate-800/70 backdrop-blur rounded-xl shadow-lg p-3 text-xs max-w-xs border border-slate-200/80 dark:border-slate-700/70 ${className}`}
    >
      <div className="space-y-1.5">
        <LegendItem color="bg-gray-400" label="Unexpanded" />
        <LegendItem color="bg-blue-400" label="Expanded" />
        <LegendItem color="bg-green-500" label="Selected" />
        <LegendItem color="bg-blue-600 animate-pulse" label="Loading" />
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${color}`} />
      <span className="text-gray-700 dark:text-gray-300 text-xs">{label}</span>
    </div>
  );
}
