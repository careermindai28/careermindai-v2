import { NextResponse } from 'next/server';
import { openai, DEFAULT_MODEL } from '@/lib/openaiClient';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
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
    const from = String(body?.from || 'English').trim();
    const to = String(body?.to || 'Hindi').trim();
    const text = String(body?.text || '').trim();
    if (text.length < 120) return jsonError('Please paste enough resume text.');

    if (!process.env.OPENAI_API_KEY)
      return jsonError('Server configuration error: OPENAI_API_KEY is missing.', 500);

    const system = `You are a professional resume translator.
Translate from ${from} to ${to}.
Rules:
- Preserve meaning, metrics, and professional tone.
- Keep ATS-friendly style (concise bullets).
- Do NOT add or invent skills.
- Preserve section headings when possible.
Return ONLY the translated text (no JSON, no markdown fences).`;

    const r = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: text },
      ],
      temperature: 0.2,
    });

    const translated = (r.choices?.[0]?.message?.content || '').trim();
    if (!translated) return jsonError('Translation failed. Please try again.', 502);

    return NextResponse.json({ ok: true, translated });
  } catch (e: any) {
    return jsonError(e?.message || 'Translation failed.', 500);
  }
}
