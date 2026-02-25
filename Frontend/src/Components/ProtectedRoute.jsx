// src/Components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../auth/UseAuth.jsx';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // On attend /api/me
  if (loading) return <div style={{ padding: 20 }}>Chargement...</div>;

  // Si pas connecté => login
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
