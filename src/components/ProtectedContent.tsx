import React from 'react';
import { useUser, SignInButton } from '@clerk/clerk-react';

interface ProtectedContentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

export function ProtectedContent({ children, fallback, requireAuth = true }: ProtectedContentProps) {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-surface-light dark:bg-surface-dark flex items-center justify-center">
        <div className="text-center card-elevated p-8 animate-scale-in">
          <div className="w-12 h-12 border-4 border-primary-40 dark:border-accent-dark-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-body-large text-on-surface-variant dark:text-gray-300">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!requireAuth || isSignedIn) {
    return <>{children}</>;
  }

  return fallback || (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark flex items-center justify-center">
      <div className="text-center card-elevated p-12 max-w-md animate-scale-in">
        <div className="w-16 h-16 bg-primary-40/10 dark:bg-accent-dark-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🔐</span>
        </div>
        <h2 className="text-headline-small text-on-surface dark:text-white mb-4">
          Sign in to continue
        </h2>
        <p className="text-body-medium text-on-surface-variant dark:text-gray-300 mb-8">
          Access your tasks, sync across devices, and unlock premium features.
        </p>
        <div className="space-y-4">
          <SignInButton mode="modal">
            <button className="btn-filled w-full bg-primary-40 dark:bg-accent-dark-gold text-on-primary dark:text-black hover:bg-primary-40/90 dark:hover:bg-accent-dark-gold/90 shadow-elevation-2 hover:shadow-elevation-3 transition-all duration-200">
              Sign In
            </button>
          </SignInButton>
          <SignInButton mode="modal">
            <button className="btn-outlined w-full border-primary-40 dark:border-accent-dark-gold text-primary-40 dark:text-accent-dark-gold hover:bg-primary-40/10 dark:hover:bg-accent-dark-gold/10">
              Create Account
            </button>
          </SignInButton>
        </div>
        <div className="mt-8 text-center text-body-small text-on-surface-variant dark:text-gray-400">
          <p className="flex items-center justify-center gap-1">
            🔒 Secure authentication • ✨ Free to get started
          </p>
        </div>
      </div>
    </div>
  );
}