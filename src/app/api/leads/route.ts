import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = (body?.email || '').toString().trim().toLowerCase();
    const source = (body?.source || 'unknown').toString().trim();
    const auditId = (body?.auditId || '').toString().trim();
    const resumeMindScore = Number(body?.resumeMindScore ?? NaN);

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const db = getAdminDb();
    await db.collection('leads').add({
      email,
      source,
      auditId: auditId || null,
      resumeMindScore: Number.isFinite(resumeMindScore) ? resumeMindScore : null,
      createdAt: new Date().toISOString(),
      meta: {
        userAgent: req.headers.get('user-agent') || null,
        referer: req.headers.get('referer') || null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to save lead' }, { status: 500 });
  }
}
