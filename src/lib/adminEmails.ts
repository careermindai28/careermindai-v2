export const ADMIN_EMAILS = new Set<string>([
  'careermindai28@gmail.com',
])

export function isAdminEmail(email?: string | null) {
  return !!email && ADMIN_EMAILS.has(email.toLowerCase())
}
