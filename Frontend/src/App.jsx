// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Provider d’authentification (contexte global)
import { AuthProvider } from './auth/AuthProvider.jsx';
import useAuth from './auth/UseAuth.jsx';

// Composants de protection + layout
import AppShell from './Components/AppShell.jsx';
import ProtectedRoute from './Components/ProtectedRoute.jsx';
import RoleGate from './Components/RoleGate.jsx';

// Pages publiques
import Login from './pages/Login.jsx';
import Forbidden from './pages/Forbidden.jsx';
import Notfound from './pages/Notfound.jsx';

// Pages Admin
import AdminHome from './pages/Admin/AdminHome.jsx';
import UsersPage from './pages/Admin/Users.jsx';
import RolesPermissionsPage from './pages/Admin/Rolespermission.jsx';

// Style global
import './styles/global.css';

/**
 * Composant qui redirige vers le bon dashboard après connexion.
 * - Si pas connecté → /login
 * - Si admin (id_role === 1) → /admin
 * - Sinon → /app
 */
function HomeRedirect() {
  const { user, loading } = useAuth();

  // Tant qu'on ne sait pas si la session existe (appel /api/me)
  if (loading) return <div style={{ padding: 20 }}>Chargement...</div>;

  // Pas connecté → page login
  if (!user) return <Navigate to="/login" replace />;

  // Admin → dashboard admin
  if (user.id_role === 1) return <Navigate to="/admin" replace />;

  // Autres rôles → espace utilisateur
  return <Navigate to="/app" replace />;
}

/**
 * Page “home” simple pour Organisateur / Coordonnateur / Comptabilité.
 * Plus tard tu vas remplacer ça par un vrai dashboard par rôle.
 */
function SimpleUserHome() {
  const { user } = useAuth();
  return (
    <div>
      <h2>Bienvenue {user?.prenom || ''}</h2>
      <p>Vous êtes connecté en tant que rôle #{user?.id_role}</p>
      <p className="muted">
        (Sprint 1 : page de test. Sprint 2 : dashboard selon rôle)
      </p>
    </div>
  );
}

export default function App() {
  return (
    // 1) AuthProvider : donne accès à user, login, logout partout dans l'app
    <AuthProvider>
      {/* 2) Router */}
      <BrowserRouter>
        <Routes>
          {/* ===================== */}
          {/*  A) ROUTES PUBLIQUES  */}
          {/* ===================== */}
          <Route path="/login" element={<Login />} />
          <Route path="/forbidden" element={<Forbidden />} />

          {/* ========================================== */}
          {/*  B) ROUTES PROTÉGÉES (SESSION OBLIGATOIRE)  */}
          {/* ========================================== */}
          <Route
            path="/"
            element={
              // ProtectedRoute : bloque l'accès si pas connecté
              <ProtectedRoute>
                {/* AppShell : layout commun (header/sidebar) + <Outlet/> */}
                <AppShell />
              </ProtectedRoute>
            }
          >
            {/* / → redirection automatique selon rôle */}
            <Route index element={<HomeRedirect />} />

            {/* =================================== */}
            {/*  ZONE UTILISATEUR (non-admin)        */}
            {/* =================================== */}
            <Route path="app" element={<SimpleUserHome />} />

            {/* =================================== */}
            {/*  ZONE ADMIN (id_role = 1)            */}
            {/* =================================== */}
            <Route
              path="admin"
              element={
                <RoleGate allowedRoles={[1]}>
                  <AdminHome />
                </RoleGate>
              }
            />

            <Route
              path="admin/users"
              element={
                <RoleGate allowedRoles={[1]}>
                  <UsersPage />
                </RoleGate>
              }
            />

            <Route
              path="admin/roles"
              element={
                <RoleGate allowedRoles={[1]}>
                  <RolesPermissionsPage />
                </RoleGate>
              }
            />
          </Route>

          {/* ===================== */}
          {/*  C) PAGE 404          */}
          {/* ===================== */}
          <Route path="*" element={<Notfound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
