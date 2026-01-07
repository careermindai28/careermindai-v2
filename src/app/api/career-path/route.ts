import { NextResponse } from 'next/server';
import { openai, DEFAULT_MODEL } from '@/lib/openaiClient';

export const runtime = 'nodejs';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function safeParseJSON(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const currentRole = String(body?.currentRole || '').trim();
    const targetRole = String(body?.targetRole || '').trim();
    const experience = String(body?.experience || '').trim();
    const location = String(body?.location || '').trim();
    const timeHorizon = String(body?.timeHorizon || '90 days').trim();
    const skills = String(body?.skills || '').trim();

    if (!targetRole) return jsonError('Target role is required.');
    if (!process.env.OPENAI_API_KEY) {
      return jsonError('Server configuration error: OPENAI_API_KEY is missing.', 500);
    }

    const system = `You are a senior career coach and hiring manager.
Return ONLY JSON with this shape:
{
  "path": {
    "targetRole": string,
    "timeHorizon": string,
    "strengths": string[],
    "gaps": string[],
    "roadmap": [ {"title": string, "why": string, "tasks": string[], "resources": string[]} ],
    "portfolioIdeas": string[]
  }
}
Rules:
- Roadmap should be practical, step-by-step, and measurable.
- Keep tasks actionable (not vague).
- Resources can be high-level (books/courses/topics) without external links.
- No markdown.`;

    const user = `User profile:
Current role: ${currentRole || '(not provided)'}
Target role: ${targetRole}
Experience (years): ${experience || '(not provided)'}
Location: ${location || '(not provided)'}
Time horizon: ${timeHorizon}
Skills: ${skills || '(not provided)'}

Generate a 30/60/90-day style roadmap aligned to the time horizon.`;

    const r = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.6,
    });

    const text = r.choices?.[0]?.message?.content || '';
    const parsed = safeParseJSON(text);
    const path = parsed?.path;
    if (!path) return jsonError('Model returned unexpected output. Please try again.', 502);

    return NextResponse.json({ ok: true, path });
  } catch (e: any) {
    return jsonError(e?.message || 'Failed to generate career path.', 500);
  }
}
