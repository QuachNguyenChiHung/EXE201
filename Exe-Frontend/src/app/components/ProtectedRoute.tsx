import { Navigate, Outlet } from 'react-router';
import { getUser, getToken } from '../../utils/auth';
import type { UserRole } from '../../types/public';

interface Props {
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: Props) {
  const user = getUser();
  const token = getToken();

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const homePaths: Record<UserRole, string> = {
      RENTER: '/renter',
      OWNER: '/warehouse',
      EMPLOYEE: '/employee',
    };
    return <Navigate to={homePaths[user.role] ?? '/'} replace />;
  }

  return <Outlet />;
}
