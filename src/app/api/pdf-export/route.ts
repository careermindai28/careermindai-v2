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
  const plan = data?.plan || 'FREE';
  const paidUntil = data?.paidUntil || null;

  const today = ymd();
  const exports = data?.exports || {};
  const todaysCount = exports?.date === today ? Number(exports?.count || 0) : 0;

  return { ref, plan, paidUntil, today, todaysCount };
}

export async function POST(req: NextRequest) {
  let browser: puppeteer.Browser | null = null;

  try {
    const body = await req.json().catch(() => ({}));
    const rawType = mustString(body?.type);
    const id = mustString(body?.id);

    if (!rawType || !id || !isPdfType(rawType)) {
      return Response.json({ ok: false, error: 'Invalid request' }, { status: 400 });
    }
    const type: PdfType = rawType;

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await getAdminAuth().verifyIdToken(token);
    const uid = decoded.uid;
    const email = (decoded as any)?.email || null;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) throw new Error('Missing NEXT_PUBLIC_APP_URL');

    const { ref, plan, paidUntil, today, todaysCount } = await getUserPlanAndUsage(uid);
    const ent = getEntitlements(plan, email);

    if (todaysCount >= ent.exportLimitPerDay) {
      return Response.json(
        { ok: false, error: 'Daily export limit reached' },
        { status: 402 }
      );
    }

    const wm = ent.watermarkOnExports ? '1' : '0';
    const exp = Math.floor(Date.now() / 1000) + 60 * 60;
    const sig = signPdfUrl({ type, id, exp });

    const printUrl =
      type === 'resume'
        ? `${baseUrl}/print/resume?builderId=${id}&wm=${wm}&exp=${exp}&sig=${sig}`
        : type === 'coverLetter'
        ? `${baseUrl}/print/cover-letter?coverLetterId=${id}&wm=${wm}&exp=${exp}&sig=${sig}`
        : `${baseUrl}/print/interview-guide?guideId=${id}&wm=${wm}&exp=${exp}&sig=${sig}`;

    const executablePath = await chromium.executablePath();

    browser = await puppeteer.launch({
      executablePath,
      headless: chromium.headless,
      args: chromium.args,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1240, height: 1754 });

    const response = await page.goto(printUrl, { waitUntil: 'domcontentloaded' });

    // ✅ SAFE wait — compatible with ALL puppeteer versions
    await new Promise((r) => setTimeout(r, 800));

    // ✅ Ensure main content exists
    const hasContent = await page.evaluate(() => {
      return document.body && document.body.innerText.length > 50;
    });

    if (!hasContent) {
      throw new Error('PRINT_PAGE_EMPTY_OR_UNAUTHORIZED');
    }

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '14mm', right: '14mm', bottom: '14mm', left: '14mm' },
    });

    if (!pdfBuffer || pdfBuffer.length < 500) {
      throw new Error('INVALID_PDF_BUFFER');
    }

    await ref.set(
      { exports: { date: today, count: todaysCount + 1 } },
      { merge: true }
    );

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename(type)}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    return Response.json(
      { ok: false, error: 'PDF export failed', detail: err.message },
      { status: 500 }
    );
  } finally {
    try {
      if (browser) await browser.close();
    } catch {}
  }
}
