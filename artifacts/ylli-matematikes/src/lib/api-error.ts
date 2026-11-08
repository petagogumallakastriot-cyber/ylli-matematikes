import type { Key } from '@/lib/dict';

function field(e: unknown, k: string): unknown {
  return typeof e === 'object' && e !== null && k in e ? (e as Record<string, unknown>)[k] : undefined;
}

export function errorCode(e: unknown): string | undefined {
  const c = field(field(e, 'data'), 'code');
  return typeof c === 'string' ? c : undefined;
}

export function errorStatus(e: unknown): number | undefined {
  const s = field(e, 'status');
  return typeof s === 'number' ? s : undefined;
}

export function apiErrorKey(e: unknown): Key {
  const code = errorCode(e);
  const status = errorStatus(e);
  switch (code) {
    case 'NICKNAME_TAKEN': return 'api.nickTaken';
    case 'INVALID_LOGIN': return 'api.invalidLogin';
    case 'INVALID_PIN': return 'api.invalidPin';
    case 'RATE_LIMIT': return 'api.rateLimit';
    case 'ALREADY_SIGNED_IN': return 'api.alreadySigned';
    case 'UNAUTHENTICATED': return 'api.unauth';
    case 'PROFILE_REQUIRED': return 'api.profileRequired';
    case 'PIN_EXISTS': return 'api.pinExists';
    case 'VALIDATION': return 'api.validation';
    case 'ORIGIN': return 'api.generic';
  }
  if (status === 409) return 'api.nickTaken';
  if (status === 429) return 'api.rateLimit';
  if (status === 401) return 'api.unauth';
  if (status === 400) return 'api.validation';
  return 'api.generic';
}
