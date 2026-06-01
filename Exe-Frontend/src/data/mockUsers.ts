import { User } from '../types/public';

/**
 * Reduced set of registered accounts for dev/UI purposes.
 */
export const MockUsers: User[] = [
  {
    id_user: 1,
    email: 'renter@example.com',
    hash_password: 'password',
    name: 'Nguyễn Văn A',
    role: 'renter',
    status: 'active',
    phone: '+84 901 234 567',
    create_at: '2024-01-15T00:00:00Z',
  },
  {
    id_user: 2,
    email: 'warehouse@example.com',
    hash_password: 'password',
    name: 'Trần Thị B',
    role: 'warehouse',
    status: 'active',
    phone: '+84 902 345 678',
    create_at: '2024-02-01T00:00:00Z',
  },
  {
    id_user: 3,
    email: 'employee@example.com',
    hash_password: 'password',
    name: 'Lê Văn C',
    role: 'employee',
    status: 'active',
    phone: '+84 903 456 789',
    create_at: '2024-01-01T00:00:00Z',
  },
];

/** Quick lookup helpers */
export const MockRenterAccounts  = MockUsers.filter(u => u.role === 'renter');
export const MockOwnerAccounts   = MockUsers.filter(u => u.role === 'warehouse');
export const MockEmployeeAccounts = MockUsers.filter(u => u.role === 'employee');

export const findUserById    = (id: number)    => MockUsers.find(u => u.id_user === id);
export const findUserByEmail = (email: string) => MockUsers.find(u => u.email === email);
