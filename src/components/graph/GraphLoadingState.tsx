import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function GraphLoadingState() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mb-4" />
        <p className="text-white">Loading graph...</p>
      </div>
    </div>
  );
}
