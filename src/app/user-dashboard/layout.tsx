'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

function withNext(signInPath: string, nextPath: string) {
  const params = new URLSearchParams();
  params.set('next', nextPath);
  return `${signInPath}?${params.toString()}`;
}

export default function UserDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || '/user-dashboard';
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(withNext('/sign-in', pathname));
    }
  }, [loading, user, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-text-secondary">
        Loading…
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
