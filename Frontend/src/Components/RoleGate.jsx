// src/Components/RoleGate.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../auth/UseAuth.jsx';

export default function RoleGate({ allowedRoles = [], children }) {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ padding: 20 }}>Chargement...</div>;
  if (!user) return <Navigate to="/login" replace />;

  // Exemple : allowedRoles=[1] si 1 = Admin
  if (!allowedRoles.includes(user.id_role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
}
