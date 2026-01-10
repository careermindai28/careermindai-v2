import crypto from 'crypto';

function base64url(input: Buffer | string) {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return b.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export function signPdfUrl(params: {
  type: 'resume' | 'coverLetter' | 'interviewGuide' | 'cheatSheet';
  id: string;
  exp: number; // unix seconds
}) {
  const secret = process.env.PDF_SIGNING_SECRET || '';
  if (!secret) throw new Error('Missing PDF_SIGNING_SECRET');

  const payload = `${params.type}.${params.id}.${params.exp}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest();
  return base64url(sig);
}

export function verifyPdfUrl(params: {
  type: 'resume' | 'coverLetter' | 'interviewGuide' | 'cheatSheet';
  id: string;
  exp: number;
  sig: string;
}) {
  const secret = process.env.PDF_SIGNING_SECRET || '';
  if (!secret) return false;

  const now = Math.floor(Date.now() / 1000);
  if (!params.exp || params.exp < now) return false;

  // Avoid throwing on bad input
  let expected = '';
  try {
    expected = signPdfUrl({ type: params.type, id: params.id, exp: params.exp });
  } catch {
    return false;
  }

  const a = Buffer.from(expected);
  const b = Buffer.from(String(params.sig || ''));
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}
