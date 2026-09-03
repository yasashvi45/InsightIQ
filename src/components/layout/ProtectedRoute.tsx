import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ children, requireOnboarding = true }: { children: React.ReactNode, requireOnboarding?: boolean }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-brand-bg)] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--color-brand-primary)] animate-spin mb-4" />
        <p className="text-[var(--color-brand-muted)] text-sm">Authenticating...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireOnboarding && !user?.onboardingCompleted) {
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
