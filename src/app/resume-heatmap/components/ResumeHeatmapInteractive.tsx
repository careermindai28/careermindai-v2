'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

type Section = { name: string; attention: number; comment: string; fix: string };
type Result = {
  overall: { score: number; summary: string };
  sections: Section[];
  blindSpots: string[];
  quickWins: string[];
};

function Bar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="w-full h-2 rounded-full bg-muted">
      <div className="h-2 rounded-full bg-primary" style={{ width: `${v}%` }} />
    </div>
  );
}

export default function ResumeHeatmapInteractive() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const analyze = async () => {
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const { getFirebaseAuth } = await import('@/lib/firebaseClient');
      const u = getFirebaseAuth().currentUser;
      const token = await u?.getIdToken(true);
      if (!token) throw new Error('Please sign in again.');

      const res = await fetch('/api/resume-heatmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Heatmap analysis failed');
      setResult(json?.result || null);
    } catch (e: any) {
      setError(e?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Resume Heatmap 🔥</h1>
        <p className="text-text-secondary">
          A recruiter-attention simulation (based on common eye-tracking findings) that shows what
          gets seen—and what gets ignored.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <div className="text-lg font-semibold text-foreground">Paste resume text</div>
          <div className="mt-4 space-y-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={18}
              placeholder="Paste your resume text here..."
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground"
            />
            <button
              onClick={analyze}
              disabled={loading || text.trim().length < 200}
              className="w-full px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-60"
            >
              {loading ? 'Analyzing...' : 'Generate heatmap'}
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
              <div className="text-lg font-semibold text-foreground">Heatmap results</div>
              <p className="text-sm text-text-secondary mt-1">
                Scores represent estimated attention share per section.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {!result && !loading ? (
              <div className="rounded-xl border border-border bg-background p-6 text-sm text-text-secondary">
                No analysis yet.
              </div>
            ) : null}

            {result ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-text-secondary">ResumeMind Attention Score</div>
                      <div className="text-2xl font-bold text-foreground">
                        {result.overall?.score ?? 0}/100
                      </div>
                    </div>
                    <Icon name="FireIcon" size={24} className="text-primary" />
                  </div>
                  {result.overall?.summary ? (
                    <div className="mt-2 text-sm text-text-secondary">{result.overall.summary}</div>
                  ) : null}
                </div>

                {Array.isArray(result.sections) && result.sections.length ? (
                  <div className="rounded-xl border border-border bg-background p-4">
                    <div className="font-semibold text-foreground">Section attention map</div>
                    <div className="mt-3 space-y-3">
                      {result.sections.slice(0, 10).map((s, i) => (
                        <div key={i} className="rounded-lg border border-border bg-surface p-3">
                          <div className="flex items-center justify-between">
                            <div className="font-semibold text-foreground">{s.name}</div>
                            <div className="text-sm text-text-secondary">
                              {Math.round(s.attention)}%
                            </div>
                          </div>
                          <div className="mt-2">
                            <Bar value={s.attention} />
                          </div>
                          {s.comment ? (
                            <div className="mt-2 text-sm text-text-secondary">{s.comment}</div>
                          ) : null}
                          {s.fix ? (
                            <div className="mt-2 text-sm">
                              <b className="text-foreground">Fix:</b>{' '}
                              <span className="text-text-secondary">{s.fix}</span>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {Array.isArray(result.blindSpots) && result.blindSpots.length ? (
                  <div className="rounded-xl border border-border bg-background p-4">
                    <div className="font-semibold text-foreground">Blind spots (likely unseen)</div>
                    <ul className="mt-2 text-sm text-text-secondary list-disc pl-5 space-y-1">
                      {result.blindSpots.slice(0, 6).map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {Array.isArray(result.quickWins) && result.quickWins.length ? (
                  <div className="rounded-xl border border-border bg-background p-4">
                    <div className="font-semibold text-foreground">Quick wins (do these first)</div>
                    <ul className="mt-2 text-sm text-text-secondary list-disc pl-5 space-y-1">
                      {result.quickWins.slice(0, 6).map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
