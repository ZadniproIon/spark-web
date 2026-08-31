export function isFatalAuthError(error: any): boolean {
  if (!error) return false;

  // Temporary network/offline or server errors should never log the user out
  if (
    error.name === 'AuthRetryableFetchError' ||
    error.name === 'AbortError' ||
    error.message?.includes('Failed to fetch') ||
    error.message?.includes('NetworkError') ||
    error.message?.includes('Network request failed') ||
    error.message?.includes('Load failed') ||
    (typeof error.status === 'number' && error.status >= 500) ||
    error.status === 0
  ) {
    return false;
  }

  const status = error.status;
  const msg = (error.message || '').toLowerCase();
  const code = (error.code || '').toLowerCase();

  // Terminal auth failures: account deleted, session revoked, invalid refresh token
  if (status === 401 || status === 403) return true;
  if (
    msg.includes('user from sub claim') ||
    msg.includes('user not found') ||
    msg.includes('invalid refresh token') ||
    msg.includes('bad_jwt') ||
    msg.includes('session_not_found') ||
    msg.includes('invalid_grant') ||
    code === 'bad_jwt' ||
    code === 'user_not_found'
  ) {
    return true;
  }

  return false;
}
