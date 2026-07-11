import { useEffect, useState } from 'react';
import { User } from '../types';

const USER_KEY = 'user';
const TOKEN_KEY = 'auth_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getUser(): User | null {
  try {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setUser(user: User | null) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getBookmarks(): string[] {
  try {
    const stored = localStorage.getItem('bookmarks');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function setBookmarks(ids: string[]) {
  localStorage.setItem('bookmarks', JSON.stringify(ids));
}

export function toggleBookmark(id: string): string[] {
  const bookmarks = getBookmarks();
  const index = bookmarks.indexOf(id);
  const newBookmarks = index >= 0
    ? bookmarks.filter(b => b !== id)
    : [...bookmarks, id];
  setBookmarks(newBookmarks);
  return newBookmarks;
}

/**
 * Reactive hook that returns the currently-logged-in user and re-renders the
 * caller whenever the user object in localStorage changes — either from a
 * cross-tab `storage` event or from same-tab updates emitted by `userService`
 * (`window.dispatchEvent(new Event('storage'))`).
 *
 * Use this instead of `getUser()` whenever the component needs to react to
 * profile updates (e.g. after `userService.getMyProfile()` merges fresh data
 * into localStorage).
 */
export function useCurrentUser(): User | null {
  const [user, setUser] = useState<User | null>(getUser());

  useEffect(() => {
    const sync = () => setUser(getUser());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  return user;
}
