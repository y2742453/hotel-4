// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./auth/AuthProvider.jsx";
import useAuth from "./auth/UseAuth.jsx";

import { ToastProvider } from "./Components/Toast.jsx";

import AppShell from "./Components/AppShell.jsx";
import ProtectedRoute from "./Components/ProtectedRoute.jsx";
import RoleGate from "./Components/RoleGate.jsx";

import Login from "./pages/Login.jsx";
import Forbidden from "./pages/Forbidden.jsx";
import Notfound from "./pages/Notfound.jsx";

import AdminHome from "./pages/Admin/AdminHome.jsx";
import UsersPage from "./pages/Admin/Users.jsx";
import RolesPermissionsPage from "./pages/Admin/RolesPermission.jsx";

import "./styles/global.css";

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 20 }}>Chargement...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (user.id_role === 1) return <Navigate to="/admin" replace />;
  return <Navigate to="/app" replace />;
}

function SimpleUserHome() {
  return <div style={{ padding: 16 }}>Bienvenue dans votre espace.</div>;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forbidden" element={<Forbidden />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<HomeRedirect />} />
              <Route path="app" element={<SimpleUserHome />} />

              {/* Admin */}
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
                path="admin/roles-permissions"
                element={
                  <RoleGate allowedRoles={[1]}>
                    <RolesPermissionsPage />
                  </RoleGate>
                }
              />
            </Route>

            <Route path="*" element={<Notfound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
