import crypto from 'crypto';

type PdfType = 'resume' | 'coverLetter' | 'interviewGuide' | 'cheatSheet';

type SignParams =
  | string
  | {
      type: PdfType;
      id: string;
      exp: number; // unix seconds
    };

function base64url(input: Buffer) {
  return input
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function toPayload(p: SignParams): string {
  if (typeof p === 'string') return p;
  const type = String(p.type || '').trim();
  const id = String(p.id || '').trim();
  const exp = Number(p.exp || 0);
  return `${type}.${id}.${exp}`;
}

export function signPdfUrl(params: SignParams) {
  const secret = process.env.PDF_SIGNING_SECRET || '';
  if (!secret) throw new Error('Missing PDF_SIGNING_SECRET');

  const payload = toPayload(params);
  const sig = crypto.createHmac('sha256', secret).update(payload).digest();
  return base64url(sig);
}

export function verifyPdfUrl(params: {
  type: PdfType;
  id: string;
  exp: number;
  sig: string;
}) {
  const secret = process.env.PDF_SIGNING_SECRET || '';
  if (!secret) return false;

  const now = Math.floor(Date.now() / 1000);
  if (!params.exp || params.exp < now) return false;

  const expected = signPdfUrl({ type: params.type, id: params.id, exp: params.exp });

  // timingSafeEqual throws if lengths differ
  const a = Buffer.from(expected);
  const b = Buffer.from(String(params.sig || ''));
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}
