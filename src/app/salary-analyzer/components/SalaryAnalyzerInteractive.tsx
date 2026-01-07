'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

type SalaryResult = {
  range: { low: string; mid: string; high: string; currency: string; notes: string };
  drivers: string[];
  negotiation: string[];
  nextSteps: string[];
  disclaimer: string;
};

export default function SalaryAnalyzerInteractive() {
  const [role, setRole] = useState('');
  const [experience, setExperience] = useState('5');
  const [location, setLocation] = useState('India');
  const [skills, setSkills] = useState('');
  const [currentSalary, setCurrentSalary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SalaryResult | null>(null);

  const analyze = async () => {
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const { getFirebaseAuth } = await import('@/lib/firebaseClient');
      const u = getFirebaseAuth().currentUser;
      const token = await u?.getIdToken(true);
      if (!token) throw new Error('Please sign in again.');

      const res = await fetch('/api/salary-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role, experience, location, skills, currentSalary }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Salary analysis failed');
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
        <h1 className="text-3xl font-bold text-foreground mb-2">Salary Analyzer 💰</h1>
        <p className="text-text-secondary">
          Estimated salary band + negotiation strategy based on role, experience, location, and
          skills.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <div className="text-lg font-semibold text-foreground">Inputs</div>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Role</label>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g., Risk Analyst"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Experience (years)
                </label>
                <input
                  type="number"
                  min={0}
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Location</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Key skills (comma-separated)
              </label>
              <textarea
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground"
                placeholder="Python, SQL, VaR, Basel, ..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Current salary (optional)
              </label>
              <input
                value={currentSalary}
                onChange={(e) => setCurrentSalary(e.target.value)}
                placeholder="e.g., 18 LPA"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground"
              />
            </div>
            <button
              onClick={analyze}
              disabled={loading || role.trim().length < 2}
              className="w-full px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-60"
            >
              {loading ? 'Analyzing...' : 'Analyze salary'}
            </button>
            {error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <div className="text-lg font-semibold text-foreground">Results</div>
          <p className="text-sm text-text-secondary mt-1">
            Use this to decide your target range and negotiation anchor.
          </p>

          <div className="mt-4 space-y-4">
            {!result && !loading ? (
              <div className="rounded-xl border border-border bg-background p-6 text-sm text-text-secondary">
                No analysis yet.
              </div>
            ) : null}

            {result ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="font-semibold text-foreground">
                    Estimated range ({result.range?.currency || ''})
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-lg border border-border bg-surface p-3">
                      <div className="text-xs text-text-secondary">Low</div>
                      <div className="font-semibold text-foreground">{result.range?.low}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-surface p-3">
                      <div className="text-xs text-text-secondary">Mid</div>
                      <div className="font-semibold text-foreground">{result.range?.mid}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-surface p-3">
                      <div className="text-xs text-text-secondary">High</div>
                      <div className="font-semibold text-foreground">{result.range?.high}</div>
                    </div>
                  </div>
                  {result.range?.notes ? (
                    <div className="mt-2 text-sm text-text-secondary">{result.range.notes}</div>
                  ) : null}
                </div>

                {Array.isArray(result.drivers) && result.drivers.length ? (
                  <div className="rounded-xl border border-border bg-background p-4">
                    <div className="font-semibold text-foreground">Key drivers</div>
                    <ul className="mt-2 text-sm text-text-secondary list-disc pl-5 space-y-1">
                      {result.drivers.slice(0, 8).map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {Array.isArray(result.negotiation) && result.negotiation.length ? (
                  <div className="rounded-xl border border-border bg-background p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-foreground">Negotiation strategy</div>
                      <Icon name="ChatBubbleLeftRightIcon" size={18} />
                    </div>
                    <ul className="mt-2 text-sm text-text-secondary list-disc pl-5 space-y-1">
                      {result.negotiation.slice(0, 8).map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {Array.isArray(result.nextSteps) && result.nextSteps.length ? (
                  <div className="rounded-xl border border-border bg-background p-4">
                    <div className="font-semibold text-foreground">
                      Next steps to reach the high band
                    </div>
                    <ul className="mt-2 text-sm text-text-secondary list-disc pl-5 space-y-1">
                      {result.nextSteps.slice(0, 8).map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {result.disclaimer ? (
                  <div className="text-xs text-text-secondary">{result.disclaimer}</div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
