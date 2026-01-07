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
    const role = String(body?.role || '').trim();
    const experience = String(body?.experience || '').trim();
    const location = String(body?.location || '').trim();
    const skills = String(body?.skills || '').trim();
    const currentSalary = String(body?.currentSalary || '').trim();
    if (!role) return jsonError('Role is required.');

    if (!process.env.OPENAI_API_KEY)
      return jsonError('Server configuration error: OPENAI_API_KEY is missing.', 500);

    const system = `You are a compensation analyst.
Return ONLY JSON with this shape:
{
  "result": {
    "range": {"low": string, "mid": string, "high": string, "currency": string, "notes": string},
    "drivers": string[],
    "negotiation": string[],
    "nextSteps": string[],
    "disclaimer": string
  }
}
Rules:
- Provide an indicative range suitable for ${location}. If location is India, currency should be INR and use LPA format.
- Be conservative and realistic.
- Do NOT claim this is scraped live data.
- Negotiation tips should be practical and ethical.
- No markdown, no extra keys.`;

    const user = `Role: ${role}
Experience (years): ${experience || '(not provided)'}
Location: ${location || '(not provided)'}
Skills: ${skills || '(not provided)'}
Current salary: ${currentSalary || '(not provided)'}`;

    const r = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.35,
    });

    const text = r.choices?.[0]?.message?.content || '';
    const parsed = safeParseJSON(text);
    const result = parsed?.result;
    if (!result) return jsonError('Model returned unexpected output. Please try again.', 502);

    return NextResponse.json({ ok: true, result });
  } catch (e: any) {
    return jsonError(e?.message || 'Salary analysis failed.', 500);
  }
}
