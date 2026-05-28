import { User } from '../types';

export function getUser(): User | null {
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setUser(user: User | null) {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
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
