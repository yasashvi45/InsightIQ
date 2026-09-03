import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export function DemoLoader() {
  const { startDemoMode } = useAuth();

  useEffect(() => {
    // Small delay for better UX
    const timer = setTimeout(() => {
      startDemoMode();
    }, 1000);
    return () => clearTimeout(timer);
  }, [startDemoMode]);

  return (
    <div className="min-h-screen bg-[var(--color-brand-bg)] flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <Loader2 className="w-12 h-12 text-[var(--color-brand-primary)] animate-spin" />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[var(--color-brand-text)] mb-2">Preparing Demo Workspace</h2>
          <p className="text-[var(--color-brand-muted)] text-sm">Loading simulated analytics data...</p>
        </div>
      </div>
    </div>
  );
}
