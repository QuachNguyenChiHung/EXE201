import { api } from './asus_api';
import { getToken, setToken } from '../utils/auth';
import type { User } from '../types/public';

export interface RegisterRequestDTO {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: 'RENTER' | 'OWNER';
  companyName?: string;
  companyTaxCode?: string;
}

export const authService = {
  /**
   * Login and populate localStorage with the user's auth token and identity.
   *
   * Flow:
   *   1. POST /auth/login → { token, email, role }
   *   2. Save token to a dedicated key so axios interceptor works on every request
   *   3. Save user profile (without token) so ProtectedRoute can read role immediately
   *
   * The full profile (name, avatar, etc.) is fetched lazily by the Navbar on mount,
   * so a failed profile fetch does NOT invalidate the session.
   */
  login: async (credentials: { email: string; password: string }): Promise<User> => {
    const { data: loginData } = await api.post('/auth/login', credentials);

    setToken(loginData.token);

    const user: User = {
      email: loginData.email,
      role: loginData.role as User['role'],
      name: loginData.fullName ?? loginData.email,
      phone: '',
      status: 'ACTIVE',
      create_at: '',
      id_user: 0,
    };
    localStorage.setItem('user', JSON.stringify(user));
    window.dispatchEvent(new Event('storage'));
    return user;
  },

  logout: async () => {
    setToken(null);
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('storage'));
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore — local cleanup already done above
    }
  },

  register: async (data: RegisterRequestDTO): Promise<string> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  isLoggedIn: (): boolean => {
    return !!getToken();
  }
};
