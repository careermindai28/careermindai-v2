import { getAdminAuth } from '@/lib/firebaseAdmin';

const ADMIN_EMAILS = new Set(['careermindai28@gmail.com']);

export async function requireAdmin(request: Request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) throw new Error('Missing auth token');

  const decoded = await getAdminAuth().verifyIdToken(token);
  const email = (decoded.email || '').toLowerCase();

  if (!ADMIN_EMAILS.has(email)) throw new Error('Forbidden');
  return { decoded, email };
}
