import { RegisteredUser } from '../types';

/**
 * All registered accounts.
 * Password is stored in plain-text here ONLY for local demo simulation —
 * never do this in a real app.
 */
export const MockUsers: RegisteredUser[] = [
  // ── Renters ──────────────────────────────────────────────────────────────
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
    id_user: 4,
    email: 'freshmart@example.com',
    hash_password: 'password',
    name: 'Lê Thị C',
    role: 'renter',
    status: 'active',
    phone: '+84 903 456 789',
    create_at: '2024-03-10T00:00:00Z',
  },
  {
    id_user: 5,
    email: 'pharma@example.com',
    hash_password: 'password',
    name: 'Phạm Quốc D',
    role: 'renter',
    status: 'active',
    phone: '+84 905 678 901',
    create_at: '2024-04-01T00:00:00Z',
  },
  {
    id_user: 6,
    email: 'dairyplus@example.com',
    hash_password: 'password',
    name: 'Hoàng Minh E',
    role: 'renter',
    status: 'active',
    phone: '+84 907 890 123',
    create_at: '2024-05-20T00:00:00Z',
  },
  {
    id_user: 7,
    email: 'seafresh@example.com',
    hash_password: 'password',
    name: 'Trần Văn F',
    role: 'renter',
    status: 'active',
    phone: '+84 909 012 345',
    create_at: '2024-06-01T00:00:00Z',
  },

  // ── Warehouse owners ──────────────────────────────────────────────────────
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
    id_user: 9,
    email: 'coldhub.hn@example.com',
    hash_password: 'password',
    name: 'Nguyễn Văn K',
    role: 'warehouse',
    status: 'active',
    phone: '+84 912 000 111',
    create_at: '2024-03-15T00:00:00Z',
  },
  {
    id_user: 10,
    email: 'saigoncold@example.com',
    hash_password: 'password',
    name: 'Võ Thanh L',
    role: 'warehouse',
    status: 'active',
    phone: '+84 916 222 333',
    create_at: '2024-06-10T00:00:00Z',
  },
  {
    id_user: 11,
    email: 'mekongfreeze@example.com',
    hash_password: 'password',
    name: 'Đặng Hữu M',
    role: 'warehouse',
    status: 'active',
    phone: '+84 918 444 555',
    create_at: '2024-08-01T00:00:00Z',
  },

  // ── Employee ──────────────────────────────────────────────────────────────
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
