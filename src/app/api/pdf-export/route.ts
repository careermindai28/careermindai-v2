import { NextRequest } from 'next/server';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { signPdfUrl } from '@/lib/pdfSign';

import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import { getEntitlements } from '@/lib/entitlements';

export const runtime = 'nodejs';

type PdfType = 'resume' | 'coverLetter' | 'interviewGuide';

function mustString(v: any) {
  return typeof v === 'string' ? v.trim() : '';
}

function isPdfType(v: string): v is PdfType {
  return v === 'resume' || v === 'coverLetter' || v === 'interviewGuide';
}

function safeFilename(type: PdfType) {
  if (type === 'resume') return 'CareerMindAI-Resume.pdf';
  if (type === 'coverLetter') return 'CareerMindAI-CoverLetter.pdf';
  return 'CareerMindAI-Interview-Guide.pdf';
}

function ymd(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function getUserPlanAndUsage(uid: string) {
  const db = getAdminDb();
  const ref = db.collection('users').doc(uid);
  const snap = await ref.get();

  const data = snap.exists ? (snap.data() as any) : {};
  const plan = (data?.plan as string) || 'FREE';
  const paidUntil = data?.paidUntil || null;

  const today = ymd();
  const exports = data?.exports || {};
  const exportsDate = exports?.date || '';
  const exportsCount = Number(exports?.count || 0);
  const todaysCount = exportsDate === today ? exportsCount : 0;

  return { ref, plan, paidUntil, today, todaysCount };
}

export async function POST(req: NextRequest) {
  let browser: puppeteer.Browser | null = null;

  try {
    const body = await req.json().catch(() => ({}));
    const rawType = mustString(body?.type);
    const id = mustString(body?.id);

    if (!rawType || !id) {
      return Response.json({ ok: false, error: 'Missing type or id' }, { status: 400 });
    }
    if (!isPdfType(rawType)) {
      return Response.json(
        { ok: false, error: `Invalid type. Must be one of: resume, coverLetter, interviewGuide` },
        { status: 400 }
      );
    }
    const type: PdfType = rawType;

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    let uid = '';
    let email: string | null = null;
    try {
      const decoded = await getAdminAuth().verifyIdToken(token);
      uid = decoded.uid;
      email = typeof (decoded as any).email === 'string' ? (decoded as any).email : null;
    } catch (err: any) {
      return Response.json(
        {
          ok: false,
          error: 'Unauthorized (invalid session). Please sign out and sign in again.',
          detail: err?.code || err?.message || 'verifyIdToken_failed',
        },
        { status: 401 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (!baseUrl) {
      return Response.json({ ok: false, error: 'Missing NEXT_PUBLIC_APP_URL' }, { status: 500 });
    }

    const { ref, plan, paidUntil, today, todaysCount } = await getUserPlanAndUsage(uid);

    // paidUntil expiry -> FREE
    let effectivePlan = plan;
    try {
      const ms =
        typeof paidUntil?.toMillis === 'function'
          ? paidUntil.toMillis()
          : typeof paidUntil === 'string'
            ? Date.parse(paidUntil)
            : typeof paidUntil === 'number'
              ? paidUntil
              : NaN;

      if (Number.isFinite(ms) && ms < Date.now()) effectivePlan = 'FREE';
    } catch {}

    const ent = getEntitlements(effectivePlan, email);

    if (todaysCount >= ent.exportLimitPerDay) {
      return Response.json(
        {
          ok: false,
          code: 'EXPORT_LIMIT_REACHED',
          error: 'Daily export limit reached. Upgrade to export unlimited PDFs.',
          plan: ent.plan,
          limit: ent.exportLimitPerDay,
        },
        { status: 402 }
      );
    }

    const wm = ent.watermarkOnExports ? '1' : '0';

    const exp = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour
    const sig = signPdfUrl({ type, id, exp });

    let printUrl = '';
    if (type === 'resume') {
      printUrl = `${baseUrl}/print/resume?builderId=${encodeURIComponent(id)}&wm=${wm}&exp=${exp}&sig=${encodeURIComponent(sig)}`;
    } else if (type === 'coverLetter') {
      printUrl = `${baseUrl}/print/cover-letter?coverLetterId=${encodeURIComponent(id)}&wm=${wm}&exp=${exp}&sig=${encodeURIComponent(sig)}`;
    } else {
      printUrl = `${baseUrl}/print/interview-guide?guideId=${encodeURIComponent(id)}&wm=${wm}&exp=${exp}&sig=${encodeURIComponent(sig)}`;
    }

    // If you ever need to debug signature issues, temporarily return this JSON:
     return Response.json({ ok: true, debug: { type, id, exp, sig, printUrl } });

    const executablePath = await chromium.executablePath();

    browser = await puppeteer.launch({
      executablePath,
      headless: chromium.headless,
      args: [
        ...chromium.args,
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 1 });

    await page.goto(printUrl, { waitUntil: 'networkidle2', timeout: 60_000 });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: false,
      margin: { top: '14mm', right: '14mm', bottom: '14mm', left: '14mm' },
    });

    await ref.set({ exports: { date: today, count: todaysCount + 1 } }, { merge: true });

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename(type)}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    return Response.json(
      {
        ok: false,
        error: 'PDF export failed',
        detail: err?.message || String(err),
      },
      { status: 500 }
    );
  } finally {
    try {
      if (browser) await browser.close();
    } catch {}
  }
}
