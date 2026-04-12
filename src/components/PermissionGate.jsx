import React from 'react';
import { useAuth } from '../hooks/useAuth';

/**
 * PermissionGate
 * Renders children only if current user has the required permission in their Profile.
 */
const PermissionGate = ({ permission, children, fallback = null }) => {
  const { hasPermission } = useAuth();

  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  return fallback;
};

export default PermissionGate;
