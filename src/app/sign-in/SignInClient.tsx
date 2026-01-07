'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';

function safeInternalNext(nextParam: string | null) {
  if (!nextParam) return '/user-dashboard';
  // Only allow internal redirects to avoid open-redirect vulnerabilities.
  if (!nextParam.startsWith('/')) return '/user-dashboard';
  // Prevent protocol-relative URLs like //evil.com
  if (nextParam.startsWith('//')) return '/user-dashboard';
  return nextParam;
}

export default function SignInClient() {
  const sp = useSearchParams();

  const nextUrl = useMemo(() => safeInternalNext(sp.get('next')), [sp]);

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="text-sm text-muted-foreground mt-2">Continue to CareerMindAI</p>

      <div className="mt-6">
        <GoogleLoginButton fullWidth redirectTo={nextUrl} />
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        By continuing, you agree to our Terms and acknowledge our Privacy Policy.
      </p>
    </div>
  );
}
