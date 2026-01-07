'use client';

import { useMemo, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useUserPlan } from '@/hooks/useUserPlan';

type CheatSheet = {
  role: string;
  oneLiner: string;
  pitch: string;
  topSkills: string[];
  likelyQuestions: { q: string; answer: string; starHint?: string }[];
  questionsToAsk: string[];
  quickReminders: string[];
};

export default function InterviewCheatSheetInteractive() {
  const plan = useUserPlan();
  const watermarkOffEligible = useMemo(
    () => plan.tier === 'PRO' && plan.isActive,
    [plan.tier, plan.isActive]
  );
  const [targetRole, setTargetRole] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<CheatSheet | null>(null);
  const [printUrl, setPrintUrl] = useState<string | null>(null);

  const generate = async () => {
    setError(null);
    setLoading(true);
    setSheet(null);
    setPrintUrl(null);
    try {
      const { getFirebaseAuth } = await import('@/lib/firebaseClient');
      const u = getFirebaseAuth().currentUser;
      const token = await u?.getIdToken(true);
      if (!token) throw new Error('Please sign in again to continue.');

      const res = await fetch('/api/interview-cheat-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          targetRole,
          resumeText,
          jobDescription,
          watermarkOffRequested: watermarkOffEligible,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to generate cheat sheet');
      setSheet(json?.sheet || null);
      setPrintUrl(typeof json?.printUrl === 'string' ? json.printUrl : null);
    } catch (e: any) {
      setError(e?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Interview Cheat Sheet</h1>
        <p className="text-text-secondary">
          Generate a crisp, 1-page prep sheet from your resume + job description: likely questions,
          answers, and STAR hints.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <div className="text-lg font-semibold text-foreground">Inputs</div>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Target role</label>
              <input
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g., Market Risk Manager"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Resume text (paste)
              </label>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={8}
                placeholder="Paste your resume text here (or key sections)"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Job description (optional but recommended)
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={6}
                placeholder="Paste JD here for best accuracy"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground"
              />
            </div>

            <button
              onClick={generate}
              disabled={loading || resumeText.trim().length < 100}
              className="w-full px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-60"
            >
              {loading ? 'Generating...' : 'Generate cheat sheet'}
            </button>

            {error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <div className="text-xs text-text-secondary">
              {watermarkOffEligible
                ? 'Pro Pass active: PDF watermark will be disabled (if global watermark is enabled, Pro overrides for this PDF).'
                : 'Starter Pass: PDF watermark may be applied based on app settings.'}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-foreground">Output</div>
              <p className="text-sm text-text-secondary mt-1">
                Designed to fit into one clean page.
              </p>
            </div>
            {printUrl ? (
              <a
                href={printUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm"
              >
                <span className="inline-flex items-center gap-1">
                  <Icon name="PrinterIcon" size={16} /> PDF / Print
                </span>
              </a>
            ) : null}
          </div>

          <div className="mt-4 space-y-4">
            {!sheet && !loading ? (
              <div className="rounded-xl border border-border bg-background p-6 text-sm text-text-secondary">
                Paste your resume text and generate.
              </div>
            ) : null}

            {sheet ? (
              <div className="rounded-xl border border-border bg-background p-4 space-y-4">
                <div>
                  <div className="text-xs text-text-secondary">Role</div>
                  <div className="font-semibold text-foreground">{sheet.role}</div>
                </div>
                {sheet.oneLiner ? (
                  <div className="text-sm text-foreground">{sheet.oneLiner}</div>
                ) : null}
                {sheet.pitch ? (
                  <div>
                    <div className="font-semibold text-foreground">60-sec pitch</div>
                    <div className="text-sm text-text-secondary mt-1">{sheet.pitch}</div>
                  </div>
                ) : null}

                {Array.isArray(sheet.topSkills) && sheet.topSkills.length ? (
                  <div>
                    <div className="font-semibold text-foreground">Top skills to emphasize</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {sheet.topSkills.slice(0, 10).map((s, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded-lg bg-muted text-sm text-text-secondary"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {Array.isArray(sheet.likelyQuestions) && sheet.likelyQuestions.length ? (
                  <div>
                    <div className="font-semibold text-foreground">
                      Likely questions + best answers
                    </div>
                    <div className="mt-2 space-y-3">
                      {sheet.likelyQuestions.slice(0, 8).map((q, i) => (
                        <div key={i} className="rounded-lg border border-border bg-surface p-3">
                          <div className="text-sm font-semibold text-foreground">Q: {q.q}</div>
                          <div className="text-sm text-text-secondary mt-1">{q.answer}</div>
                          {q.starHint ? (
                            <div className="mt-2 text-xs text-text-secondary">
                              <b>STAR hint:</b> {q.starHint}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {Array.isArray(sheet.questionsToAsk) && sheet.questionsToAsk.length ? (
                  <div>
                    <div className="font-semibold text-foreground">Questions to ask them</div>
                    <ul className="mt-2 text-sm text-text-secondary list-disc pl-5 space-y-1">
                      {sheet.questionsToAsk.slice(0, 6).map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {Array.isArray(sheet.quickReminders) && sheet.quickReminders.length ? (
                  <div>
                    <div className="font-semibold text-foreground">Quick reminders</div>
                    <ul className="mt-2 text-sm text-text-secondary list-disc pl-5 space-y-1">
                      {sheet.quickReminders.slice(0, 6).map((s, i) => (
                        <li key={i}>{s}</li>
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
