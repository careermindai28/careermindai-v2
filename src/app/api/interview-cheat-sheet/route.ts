import { NextResponse } from 'next/server';
import { openai, DEFAULT_MODEL } from '@/lib/openaiClient';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import { signPdfUrl } from '@/lib/pdfSign';

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

    const active = (tier === 'STARTER' || tier === 'PRO') && isActiveUntil(paidUntil);
    if (!active) return jsonError('This feature requires an active Starter/Pro pass.', 403);

    const body = await req.json().catch(() => null);
    const targetRole = String(body?.targetRole || '').trim();
    const resumeText = String(body?.resumeText || '').trim();
    const jobDescription = String(body?.jobDescription || '').trim();
    const watermarkOffRequested = !!body?.watermarkOffRequested;

    if (!resumeText || resumeText.length < 80) {
      return jsonError('Please paste enough resume text.');
    }

    if (!process.env.OPENAI_API_KEY) {
      return jsonError('Server configuration error: OPENAI_API_KEY is missing.', 500);
    }

    const system = `You are an expert interview coach. Return ONLY JSON with this shape:
{
  "sheet": {
    "role": string,
    "oneLiner": string,
    "pitch": string,
    "topSkills": string[],
    "likelyQuestions": [ {"q": string, "answer": string, "starHint": string} ],
    "questionsToAsk": string[],
    "quickReminders": string[]
  }
}
Rules:
- Output must be crisp and fit on ~1 printed page.
- Answers should be concise, high quality, and realistic.
- Do not invent skills not present in resume.
- If JD is present, align to it; if not, align to target role.
- No markdown. No extra keys.`;

    const user = `Target role: ${targetRole || '(not provided)'}

Resume:
${resumeText}

Job description:
${jobDescription || '(not provided)'}`;

    const r = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.4,
    });

    const text = r.choices?.[0]?.message?.content || '';
    const parsed = safeParseJSON(text);
    const sheet = parsed?.sheet;
    if (!sheet) return jsonError('Model returned unexpected output. Please try again.', 502);

    // Store for print
    const sheetId = db.collection('cheatSheets').doc().id;
    await db
      .collection('cheatSheets')
      .doc(sheetId)
      .set({
        uid,
        createdAt: new Date().toISOString(),
        content: sheet,
        meta: {
          targetRole,
          hasJD: !!jobDescription,
          tier,
        },
      });

    // Signed print URL (1 hour)
    const exp = Math.floor(Date.now() / 1000) + 60 * 60;
    const sig = signPdfUrl({ type: 'cheatSheet', id: sheetId, exp });
    const wm = tier === 'PRO' && watermarkOffRequested ? '0' : '1';
    const printUrl = `/print/interview-cheat-sheet?sheetId=${encodeURIComponent(sheetId)}&exp=${exp}&sig=${encodeURIComponent(sig)}&wm=${wm}`;

    return NextResponse.json({ ok: true, sheet, sheetId, printUrl });
  } catch (e: any) {
    return jsonError(e?.message || 'Failed to generate cheat sheet.', 500);
  }
}
