import { api } from './asus_api';
import type { User } from '../types/public';

export interface RegisterRequestDTO {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: string;
  companyName?: string;
  companyTaxCode?: string;
}

export const authService = {
  /**
   * Login and populate localStorage with the full user profile.
   *
   * Flow:
   *   1. POST /auth/login → { token, tokenType, email, role }
   *   2. Save partial user to localStorage (so ProtectedRoute can read it immediately)
   *   3. GET /users/me    → full profile (name, avatarUrl, phone, company …)
   *   4. Merge profile into localStorage so Navbar shows the real name
   */
  login: async (credentials: { email: string; password: string }): Promise<User> => {
    console.log('[API CALL] POST /auth/login', credentials);
    const { data: loginData } = await api.post('/auth/login', credentials);
    console.log('[API RESPONSE]', loginData);

    const partialUser: Partial<User> & { token: string } = {
      token: loginData.token,
      email: loginData.email,
      role: loginData.role,
    };
    localStorage.setItem('user', JSON.stringify(partialUser));

    // Fetch the full profile so Navbar / dashboard greet the user by name.
    // This call merges the backend profile into localStorage via mergeProfileIntoUser.
    const { userService } = await import('./userService');
    const profile = await userService.getMyProfile();
    // getMyProfile already updated localStorage; read it back to return the full User.
    const stored = localStorage.getItem('user');
    return stored ? (JSON.parse(stored) as User) : (partialUser as User);
  },

  logout: async () => {
    console.log('[API CALL] POST /auth/logout');
    const response = await api.post('/auth/logout');
    console.log('[API RESPONSE]', response.data);
    return response.data;
  },

  register: async (data: RegisterRequestDTO): Promise<string> => {
    console.log('[API CALL] POST /auth/register', data);
    const response = await api.post('/auth/register', data);
    console.log('[API RESPONSE]', response.data);
    return response.data;
  }
};
