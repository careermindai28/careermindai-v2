// src/lib/pdfSign.ts
import crypto from 'crypto';

const SECRET = process.env.PDF_SIGNING_SECRET;

if (!SECRET) {
  throw new Error('PDF_SIGNING_SECRET is not set');
}

function base64url(input: Buffer) {
  return input
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function signPdfUrl(payload: string) {
  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(payload);
  return base64url(hmac.digest());
}

export function verifyPdfUrl(payload: string, sig: string) {
  try {
    const expected = signPdfUrl(payload);
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(sig)
    );
  } catch {
    return false;
  }
}
