import { Navigate, Outlet } from 'react-router';
import { getUser } from '../../utils/auth';
import type { UserRole } from '../../types';

interface Props {
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: Props) {
  const user = getUser();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const homePaths: Record<UserRole, string> = {
      renter: '/renter',
      warehouse: '/warehouse',
      employee: '/employee',
    };
    return <Navigate to={homePaths[user.role] ?? '/'} replace />;
  }

  return <Outlet />;
}
