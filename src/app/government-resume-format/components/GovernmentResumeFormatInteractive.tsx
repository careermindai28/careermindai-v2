'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

export default function GovernmentResumeFormatInteractive() {
  const [exam, setExam] = useState('SSC / Govt Job');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [out, setOut] = useState('');

  const generate = async () => {
    setError(null);
    setLoading(true);
    setOut('');
    try {
      const { getFirebaseAuth } = await import('@/lib/firebaseClient');
      const u = getFirebaseAuth().currentUser;
      const token = await u?.getIdToken(true);
      if (!token) throw new Error('Please sign in again.');

      const res = await fetch('/api/govt-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ exam, text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to generate govt format');
      setOut(String(json?.formatted || ''));
    } catch (e: any) {
      setError(e?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(out);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Government Job Resume Format</h1>
        <p className="text-text-secondary">
          Generate UPSC/SSC-style resume formats: structured biodata, education table,
          government-friendly wording, and declarations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <div className="text-lg font-semibold text-foreground">Input</div>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Target format
              </label>
              <select
                value={exam}
                onChange={(e) => setExam(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground"
              >
                <option>SSC / Govt Job</option>
                <option>UPSC (Biodata style)</option>
                <option>State Government</option>
                <option>PSU / Government Bank</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Your resume text (paste)
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={16}
                placeholder="Paste resume or key details here"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground"
              />
            </div>
            <button
              onClick={generate}
              disabled={loading || text.trim().length < 120}
              className="w-full px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-60"
            >
              {loading ? 'Generating...' : 'Generate format'}
            </button>
            {error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-foreground">Output</div>
              <p className="text-sm text-text-secondary mt-1">
                Copy/paste into your document. You can export via your editor.
              </p>
            </div>
            {out ? (
              <button
                onClick={copy}
                className="px-3 py-2 rounded-lg border border-border hover:bg-muted text-sm"
              >
                <span className="inline-flex items-center gap-1">
                  <Icon name="ClipboardIcon" size={16} /> Copy
                </span>
              </button>
            ) : null}
          </div>

          <div className="mt-4">
            {out ? (
              <pre className="whitespace-pre-wrap text-sm text-foreground leading-relaxed font-sans rounded-xl border border-border bg-background p-4">
                {out}
              </pre>
            ) : (
              <div className="rounded-xl border border-border bg-background p-6 text-sm text-text-secondary">
                No output yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
