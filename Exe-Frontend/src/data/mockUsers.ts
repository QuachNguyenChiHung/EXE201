import { RegisteredUser } from '../types';

/**
 * All registered accounts.
 * Password is stored in plain-text here ONLY for local demo simulation —
 * never do this in a real app.
 */
export const MockUsers: RegisteredUser[] = [
  // ── Renters ──────────────────────────────────────────────────────────────
  {
    id: 'user-1',
    email: 'renter@example.com',
    password: 'password',
    name: 'Nguyễn Văn A',
    role: 'renter',
    companyName: 'ABC Foods Vietnam',
    phone: '+84 901 234 567',
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'user-4',
    email: 'freshmart@example.com',
    password: 'password',
    name: 'Lê Thị C',
    role: 'renter',
    companyName: 'FreshMart Co.',
    phone: '+84 903 456 789',
    createdAt: '2024-03-10T00:00:00Z',
  },
  {
    id: 'user-5',
    email: 'pharma@example.com',
    password: 'password',
    name: 'Phạm Quốc D',
    role: 'renter',
    companyName: 'Pharma Group VN',
    phone: '+84 905 678 901',
    createdAt: '2024-04-01T00:00:00Z',
  },
  {
    id: 'user-6',
    email: 'dairyplus@example.com',
    password: 'password',
    name: 'Hoàng Minh E',
    role: 'renter',
    companyName: 'Dairy Plus',
    phone: '+84 907 890 123',
    createdAt: '2024-05-20T00:00:00Z',
  },
  {
    id: 'user-7',
    email: 'seafresh@example.com',
    password: 'password',
    name: 'Trần Văn F',
    role: 'renter',
    companyName: 'SeaFresh Co.',
    phone: '+84 909 012 345',
    createdAt: '2024-06-01T00:00:00Z',
  },

  // ── Warehouse owners ──────────────────────────────────────────────────────
  {
    id: 'user-2',
    email: 'warehouse@example.com',
    password: 'password',
    name: 'Trần Thị B',
    role: 'warehouse',
    companyName: 'Cold Storage Solutions',
    phone: '+84 902 345 678',
    createdAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'user-9',
    email: 'coldhub.hn@example.com',
    password: 'password',
    name: 'Nguyễn Văn K',
    role: 'warehouse',
    companyName: 'Hanoi Cold Hub',
    phone: '+84 912 000 111',
    createdAt: '2024-03-15T00:00:00Z',
  },
  {
    id: 'user-10',
    email: 'saigoncold@example.com',
    password: 'password',
    name: 'Võ Thanh L',
    role: 'warehouse',
    companyName: 'Saigon Cold Chain',
    phone: '+84 916 222 333',
    createdAt: '2024-06-10T00:00:00Z',
  },
  {
    id: 'user-11',
    email: 'mekongfreeze@example.com',
    password: 'password',
    name: 'Đặng Hữu M',
    role: 'warehouse',
    companyName: 'Mekong Freeze Logistics',
    phone: '+84 918 444 555',
    createdAt: '2024-08-01T00:00:00Z',
  },

  // ── Employee ──────────────────────────────────────────────────────────────
  {
    id: 'user-3',
    email: 'employee@example.com',
    password: 'password',
    name: 'Lê Văn C',
    role: 'employee',
    phone: '+84 903 456 789',
    createdAt: '2024-01-01T00:00:00Z',
  },
];

/** Quick lookup helpers */
export const MockRenterAccounts  = MockUsers.filter(u => u.role === 'renter');
export const MockOwnerAccounts   = MockUsers.filter(u => u.role === 'warehouse');
export const MockEmployeeAccounts = MockUsers.filter(u => u.role === 'employee');

export const findUserById    = (id: string)    => MockUsers.find(u => u.id === id);
export const findUserByEmail = (email: string) => MockUsers.find(u => u.email === email);