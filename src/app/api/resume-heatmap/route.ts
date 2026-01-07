import { NextResponse } from 'next/server';
import { openai, DEFAULT_MODEL } from '@/lib/openaiClient';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';

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

function isActiveUntil(paidUntil?: string) {
  if (!paidUntil) return false;
  const t = Date.parse(paidUntil);
  return Number.isFinite(t) && t > Date.now();
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) return jsonError('Unauthorized (missing token).', 401);

    const decoded = await getAdminAuth().verifyIdToken(token);
    const uid = decoded.uid;
    const db = getAdminDb();

    const uSnap = await db.collection('users').doc(uid).get();
    const u = uSnap.exists ? (uSnap.data() as any) : {};
    const tier = String(u?.plan || 'FREE').toUpperCase();
    const paidUntil = typeof u?.paidUntil === 'string' ? u.paidUntil : undefined;
    const active = tier === 'PRO' && isActiveUntil(paidUntil);
    if (!active) return jsonError('This feature requires an active Pro pass.', 403);

    const body = await req.json().catch(() => null);
    const text = String(body?.text || '').trim();
    if (text.length < 200) return jsonError('Please paste enough resume text.');
    if (!process.env.OPENAI_API_KEY)
      return jsonError('Server configuration error: OPENAI_API_KEY is missing.', 500);

    const system = `You are a recruiter UX analyst.
Return ONLY JSON with this shape:
{
  "result": {
    "overall": {"score": number, "summary": string},
    "sections": [ {"name": string, "attention": number, "comment": string, "fix": string} ],
    "blindSpots": string[],
    "quickWins": string[]
  }
}
Rules:
- Attention values are percentages (0-100) and should roughly sum to ~100.
- Use typical resume scanning behavior (top-left, headings, metrics).
- Be honest and specific.
- No markdown, no extra keys.`;

    const r = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: text },
      ],
      temperature: 0.3,
    });

    const out = r.choices?.[0]?.message?.content || '';
    const parsed = safeParseJSON(out);
    const result = parsed?.result;
    if (!result) return jsonError('Model returned unexpected output. Please try again.', 502);

    return NextResponse.json({ ok: true, result });
  } catch (e: any) {
    return jsonError(e?.message || 'Heatmap analysis failed.', 500);
  }
}
