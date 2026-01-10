import { NextRequest } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

const ADMIN_EMAILS = new Set(['careermindai28@gmail.com']);

function mustString(v: any) {
  return typeof v === 'string' ? v.trim() : '';
}

export async function POST(req: NextRequest) {
  try {
    // ✅ Require signed-in admin
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      return Response.json({ ok: false, error: 'Unauthorized (missing token).' }, { status: 401 });
    }

    const decoded = await getAdminAuth().verifyIdToken(token);
    const callerEmail = String((decoded as any).email || '').toLowerCase();
    if (!ADMIN_EMAILS.has(callerEmail)) {
      return Response.json({ ok: false, error: 'Forbidden.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const email = mustString(body?.email).toLowerCase();
    const plan = mustString(body?.plan);

    if (!email || !plan) {
      return Response.json({ ok: false, error: 'Missing email or plan.' }, { status: 400 });
    }
    if (!['FREE', 'PAID', 'STARTER', 'PRO'].includes(plan)) {
      return Response.json({ ok: false, error: 'Invalid plan value.' }, { status: 400 });
    }

    const user = await getAdminAuth().getUserByEmail(email);
    const db = getAdminDb();

    await db.collection('users').doc(user.uid).set(
      {
        plan: plan === 'PAID' ? 'PRO' : plan, // backward compatible
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || 'Admin action failed.' }, { status: 500 });
  }
}
