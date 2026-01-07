'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

type Milestone = {
  title: string;
  why: string;
  tasks: string[];
  resources: string[];
};

type Path = {
  targetRole: string;
  timeHorizon: string;
  strengths: string[];
  gaps: string[];
  roadmap: Milestone[];
  portfolioIdeas: string[];
};

export default function CareerPathGeneratorInteractive() {
  const [currentRole, setCurrentRole] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [experience, setExperience] = useState('5');
  const [location, setLocation] = useState('India');
  const [timeHorizon, setTimeHorizon] = useState('90 days');
  const [skills, setSkills] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [path, setPath] = useState<Path | null>(null);

  const generate = async () => {
    setError(null);
    setLoading(true);
    setPath(null);
    try {
      const res = await fetch('/api/career-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentRole,
          targetRole,
          experience,
          location,
          timeHorizon,
          skills,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to generate career path');
      setPath(json?.path || null);
    } catch (e: any) {
      setError(e?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">CareerPath Generator</h1>
        <p className="text-text-secondary">
          Get a personalized 30/60/90-day roadmap, skills plan, and portfolio ideas based on your
          target role.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <div className="text-lg font-semibold text-foreground">Your profile</div>

          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Current role
                </label>
                <input
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value)}
                  placeholder="e.g., Market Risk Analyst"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Target role
                </label>
                <input
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g., Quant Risk / Model Validation"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Experience (years)
                </label>
                <input
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  type="number"
                  min={0}
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
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Time horizon
                </label>
                <select
                  value={timeHorizon}
                  onChange={(e) => setTimeHorizon(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground"
                >
                  <option>30 days</option>
                  <option>60 days</option>
                  <option>90 days</option>
                  <option>180 days</option>
                </select>
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
                placeholder="e.g., FRM, Basel, Python, SQL, VaR, credit risk, stakeholder management"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground"
              />
            </div>

            <button
              onClick={generate}
              disabled={loading || targetRole.trim().length < 2}
              className="w-full px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-60"
            >
              {loading ? 'Generating...' : 'Generate my roadmap'}
            </button>

            {error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <div className="text-lg font-semibold text-foreground">Your roadmap</div>
          <p className="text-sm text-text-secondary mt-1">
            A practical plan you can execute with measurable outcomes.
          </p>

          <div className="mt-4 space-y-4">
            {!path && !loading ? (
              <div className="rounded-xl border border-border bg-background p-6 text-sm text-text-secondary">
                Enter your target role and click <b>Generate</b>.
              </div>
            ) : null}

            {path ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="font-semibold text-foreground">Strengths to leverage</div>
                  <ul className="mt-2 text-sm text-text-secondary list-disc pl-5 space-y-1">
                    {(path.strengths || []).slice(0, 6).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="font-semibold text-foreground">Gaps to close</div>
                  <ul className="mt-2 text-sm text-text-secondary list-disc pl-5 space-y-1">
                    {(path.gaps || []).slice(0, 6).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                {(path.roadmap || []).map((m, i) => (
                  <div key={i} className="rounded-xl border border-border bg-background p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-foreground">{m.title}</div>
                        <div className="text-sm text-text-secondary mt-1">{m.why}</div>
                      </div>
                      <Icon name="CheckCircleIcon" size={20} className="text-success" />
                    </div>
                    {Array.isArray(m.tasks) && m.tasks.length ? (
                      <ul className="mt-3 text-sm text-text-secondary list-disc pl-5 space-y-1">
                        {m.tasks.slice(0, 6).map((t, idx) => (
                          <li key={idx}>{t}</li>
                        ))}
                      </ul>
                    ) : null}
                    {Array.isArray(m.resources) && m.resources.length ? (
                      <div className="mt-3 text-sm">
                        <div className="font-medium text-foreground">Resources</div>
                        <ul className="mt-1 text-text-secondary list-disc pl-5 space-y-1">
                          {m.resources.slice(0, 4).map((r, idx) => (
                            <li key={idx}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ))}

                {Array.isArray(path.portfolioIdeas) && path.portfolioIdeas.length ? (
                  <div className="rounded-xl border border-border bg-background p-4">
                    <div className="font-semibold text-foreground">
                      Portfolio / proof-of-work ideas
                    </div>
                    <ul className="mt-2 text-sm text-text-secondary list-disc pl-5 space-y-1">
                      {path.portfolioIdeas.slice(0, 6).map((p, i) => (
                        <li key={i}>{p}</li>
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
