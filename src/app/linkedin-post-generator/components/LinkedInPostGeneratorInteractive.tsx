'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

type Variant = {
  title: string;
  post: string;
  hashtags: string[];
};

export default function LinkedInPostGeneratorInteractive() {
  const [topic, setTopic] = useState('');
  const [achievement, setAchievement] = useState('');
  const [audience, setAudience] = useState('Recruiters');
  const [tone, setTone] = useState('Professional');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);

  const generate = async () => {
    setError(null);
    setLoading(true);
    setVariants([]);
    try {
      const res = await fetch('/api/linkedin-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, achievement, audience, tone, length }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to generate posts');
      setVariants(Array.isArray(json?.variants) ? json.variants : []);
    } catch (e: any) {
      setError(e?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">LinkedIn Post Generator</h1>
        <p className="text-text-secondary">
          Create high-engagement LinkedIn posts that build your personal brand—hooks, structure, and
          hashtags included.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <div className="text-lg font-semibold text-foreground">Your input</div>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Topic (required)
              </label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., How I improved my ResumeMind Score™ from 62 to 84"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Achievement / story details (optional)
              </label>
              <textarea
                value={achievement}
                onChange={(e) => setAchievement(e.target.value)}
                rows={4}
                placeholder="Add details, numbers, context, outcome..."
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Audience</label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground"
                >
                  <option>Recruiters</option>
                  <option>Hiring Managers</option>
                  <option>Peers</option>
                  <option>Founders</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground"
                >
                  <option>Professional</option>
                  <option>Confident</option>
                  <option>Friendly</option>
                  <option>Storytelling</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Length</label>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground"
                >
                  <option value="short">Short (under 1200 chars)</option>
                  <option value="medium">Medium (1200–2000 chars)</option>
                  <option value="long">Long (2000–2800 chars)</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={generate}
                  disabled={loading || topic.trim().length < 3}
                  className="w-full px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-60"
                >
                  {loading ? 'Generating...' : 'Generate 3 variants'}
                </button>
              </div>
            </div>

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
            Pick one and post. If you want, regenerate with a different tone.
          </p>

          <div className="mt-4 space-y-4">
            {variants.length === 0 && !loading ? (
              <div className="rounded-xl border border-border bg-background p-6 text-sm text-text-secondary">
                No posts yet. Fill the inputs and click <b>Generate</b>.
              </div>
            ) : null}

            {variants.map((v, idx) => {
              const fullText = `${v.post}\n\n${(v.hashtags || []).map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')}`;
              return (
                <div key={idx} className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-foreground">
                        {v.title || `Variant ${idx + 1}`}
                      </div>
                      <div className="text-xs text-text-secondary">
                        Optimized for {audience} • {tone}
                      </div>
                    </div>
                    <button
                      onClick={() => copy(fullText)}
                      className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-sm"
                      title="Copy"
                    >
                      <span className="inline-flex items-center gap-1">
                        <Icon name="ClipboardIcon" size={16} /> Copy
                      </span>
                    </button>
                  </div>

                  <pre className="mt-3 whitespace-pre-wrap text-sm text-foreground leading-relaxed font-sans">
                    {v.post}
                  </pre>

                  {Array.isArray(v.hashtags) && v.hashtags.length > 0 ? (
                    <div className="mt-3 text-sm text-text-secondary">
                      {(v.hashtags || []).map((h, i) => (
                        <span
                          key={i}
                          className="inline-block mr-2 mb-2 px-2 py-1 rounded-lg bg-muted text-text-secondary"
                        >
                          {h.startsWith('#') ? h : `#${h}`}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
