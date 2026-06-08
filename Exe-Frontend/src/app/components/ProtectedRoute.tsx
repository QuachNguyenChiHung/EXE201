import { Navigate, Outlet } from 'react-router';
import { getUser } from '../../utils/auth';
import type { UserRole } from '../../types/public';

interface Props {
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: Props) {
  const user = getUser();

  if (!user || !(user as any).token) {
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
