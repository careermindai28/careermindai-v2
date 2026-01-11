import crypto from 'crypto';

type PdfType = 'resume' | 'coverLetter' | 'interviewGuide' | 'cheatSheet';

function base64url(input: Buffer) {
  return input
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * One canonical payload builder used by BOTH sign and verify.
 * This eliminates hidden differences that cause "Invalid or expired link".
 */
function canonicalPayload(p: { type: PdfType; id: string; exp: number }) {
  return JSON.stringify({
    type: String(p.type),
    id: String(p.id),
    exp: Number(p.exp),
  });
}

export function signPdfUrl(p: { type: PdfType; id: string; exp: number }) {
  const secret = process.env.PDF_SIGNING_SECRET || '';
  if (!secret) throw new Error('Missing PDF_SIGNING_SECRET');

  const payload = canonicalPayload(p);
  const sig = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest();
  return base64url(sig);
}

export function verifyPdfUrl(p: { type: PdfType; id: string; exp: number; sig: string }) {
  const secret = process.env.PDF_SIGNING_SECRET || '';
  if (!secret) return false;

  const now = Math.floor(Date.now() / 1000);
  if (!p.exp || p.exp < now) return false;

  const expected = signPdfUrl({ type: p.type, id: p.id, exp: p.exp });

  // timingSafeEqual throws if lengths differ
  const a = Buffer.from(expected);
  const b = Buffer.from(String(p.sig || ''));
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}
