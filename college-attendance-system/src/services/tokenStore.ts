// Global token store - does not depend on localStorage or sessionStorage
const store = {
  token: null as string | null,
  user: null as string | null,
};

export function saveAuth(token: string, user: string) {
  store.token = token;
  store.user = user;
  try { localStorage.setItem('token', token); localStorage.setItem('user', user); } catch {}
  try { sessionStorage.setItem('token', token); sessionStorage.setItem('user', user); } catch {}
}

export function loadToken(): string | null {
  if (store.token) return store.token;
  try { const v = localStorage.getItem('token'); if (v) { store.token = v; return v; } } catch {}
  try { const v = sessionStorage.getItem('token'); if (v) { store.token = v; return v; } } catch {}
  return null;
}

export function loadUser(): string | null {
  if (store.user) return store.user;
  try { const v = localStorage.getItem('user'); if (v) { store.user = v; return v; } } catch {}
  try { const v = sessionStorage.getItem('user'); if (v) { store.user = v; return v; } } catch {}
  return null;
}

export function clearAuth() {
  store.token = null;
  store.user = null;
  try { localStorage.clear(); } catch {}
  try { sessionStorage.clear(); } catch {}
}
