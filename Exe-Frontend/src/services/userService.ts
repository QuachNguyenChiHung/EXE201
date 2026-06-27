import { api } from './asus_api';
import type { UserProfileDTO } from '../types/employee';
import type { User } from '../types/public';

export interface UserProfileUpdateDTO {
  fullName: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  /** Owners only — owners can edit their company name/tax code from the profile page */
  companyName?: string;
  companyTaxCode?: string;
}

function normalize(dto: any): UserProfileDTO {
  return {
    ...dto,
    company: dto.company
      ? {
          id: dto.company.id,
          companyName: dto.company.companyName,
          companyTaxCode: dto.company.companyTaxCode,
        }
      : null,
  };
}

/**
 * Merge backend UserProfileDTO fields back into the localStorage `User` shape
 * so the Navbar / login flow stays consistent.
 *
 * Backend field  →  localStorage User field
 *   fullName      →  name
 *   avatarUrl     →  img_link
 *   phone         →  phone  (same)
 *   email         →  email  (same)
 *   role          →  role   (same)
 *   company       →  company (shape differs, merge carefully)
 */
function mergeProfileIntoUser(profile: UserProfileDTO, existing: User): User {
  return {
    ...existing,
    name: profile.fullName,
    img_link: profile.avatarUrl,
    phone: profile.phone,
    email: profile.email,
    role: profile.role as User['role'],
    status: profile.status,
    company: profile.company
      ? {
          ...existing.company,
          id_company: profile.company.id,
          company_name: profile.company.companyName,
          company_tax_code: profile.company.companyTaxCode,
        }
      : existing.company,
  };
}

export const userService = {
  /** GET /api/users/me — fetch the currently logged-in user's profile.
   *  Side effect: also merges the fetched fields into the localStorage `user`
   *  object so the Navbar / dashboard greeting renders the real name on every
   *  page load (not just right after login). */
  getMyProfile: async (): Promise<UserProfileDTO> => {
    console.log('[API CALL] GET /users/me');
    const res = await api.get('/users/me');
    console.log('[API RESPONSE]', res.data);
    const profile = normalize(res.data);
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const user: User = JSON.parse(stored);
        const merged = mergeProfileIntoUser(profile, user);
        localStorage.setItem('user', JSON.stringify(merged));
        window.dispatchEvent(new Event('storage'));
      } catch {
        // ignore parse errors
      }
    }
    return profile;
  },

  /** PATCH /api/users/me — update full name, phone, and (optionally) company fields. */
  updateMyProfile: async (dto: UserProfileUpdateDTO): Promise<UserProfileDTO> => {
    console.log('[API CALL] PATCH /users/me', dto);
    const res = await api.patch('/users/me', dto);
    console.log('[API RESPONSE]', res.data);
    const profile = normalize(res.data);
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const user: User = JSON.parse(stored);
        localStorage.setItem('user', JSON.stringify(mergeProfileIntoUser(profile, user)));
        window.dispatchEvent(new Event('storage')); // nudge Navbar if on same tab
      } catch {
        // ignore parse errors
      }
    }
    return profile;
  },

  /**
   * POST /api/users/me/avatar — upload a new profile picture.
   * The shared axios instance already strips the JSON Content-Type for FormData bodies.
   */
  uploadAvatar: async (file: File): Promise<UserProfileDTO> => {
    console.log('[API CALL] POST /users/me/avatar', { fileName: file.name, fileSize: file.size, fileType: file.type });
    const form = new FormData();
    form.append('file', file);
    const res = await api.post('/users/me/avatar', form);
    console.log('[API RESPONSE]', res.data);
    const profile = normalize(res.data);
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const user: User = JSON.parse(stored);
        localStorage.setItem('user', JSON.stringify(mergeProfileIntoUser(profile, user)));
        window.dispatchEvent(new Event('storage'));
      } catch {
        // ignore parse errors
      }
    }
    return profile;
  },
};

export type { UserProfileDTO };
