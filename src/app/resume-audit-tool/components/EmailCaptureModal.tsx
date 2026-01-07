'use client';

import { useMemo, useState } from 'react';
import Icon from '@/components/ui/AppIcon';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function EmailCaptureModal({
  open,
  onClose,
  onSubmit,
  title = 'Save your Resume Audit',
  subtitle = 'Get your report link, unlock AI Resume Builder, and receive future upgrades.',
  defaultEmail = '',
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (email: string) => Promise<void> | void;
  title?: string;
  subtitle?: string;
  defaultEmail?: string;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = useMemo(() => isValidEmail(email), [email]);

  if (!open) return null;

  const submit = async () => {
    setErr(null);
    if (!canSubmit) {
      setErr('Please enter a valid email.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(email.trim());
      onClose();
    } catch (e: any) {
      setErr(e?.message || 'Could not save your email. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] bg-black/50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-surface border border-border rounded-2xl p-6 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xl font-semibold text-foreground">{title}</div>
            <div className="mt-1 text-sm text-text-secondary">{subtitle}</div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <Icon name="XMarkIcon" size={18} className="text-text-secondary" />
          </button>
        </div>

        <div className="mt-5">
          <label className="block text-sm font-medium text-foreground">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@email.com"
            className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/40"
          />
          {err ? (
            <div className="mt-2 text-sm text-red-300">{err}</div>
          ) : (
            <div className="mt-2 text-xs text-text-secondary">
              We’ll only email product updates and your saved outputs. No spam.
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border bg-background text-foreground"
            disabled={submitting}
          >
            Not now
          </button>
          <button
            onClick={submit}
            className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-60"
            disabled={submitting || !canSubmit}
          >
            {submitting ? 'Saving…' : 'Save & continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
