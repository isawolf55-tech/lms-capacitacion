import { cookies } from 'next/headers';
import { verifySessionToken, TokenPayload } from './auth';

const SESSION_COOKIE = 'lms_session';

export async function getSessionUser(): Promise<TokenPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}
