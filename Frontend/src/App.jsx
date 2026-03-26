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
import SallesPage from "./pages/Admin/Salles.jsx";
import ServicesPage from "./pages/Admin/Services.jsx";
import EvenementsAdmin from "./pages/Admin/Evenements.jsx";

import Calendar from "./pages/Organisateur/Calendar.jsx";
import OrganisateurHome from "./pages/Organisateur/OrganisateurHome.jsx";
import CreerEvenement from "./pages/Organisateur/CreerEvenement.jsx";
import EvenementServices from "./pages/Organisateur/EvenementServices.jsx";
import ListeEvenements from "./pages/Organisateur/ListeEvenements.jsx";
import MesDemandesServices from "./pages/Organisateur/demandes-services.jsx";

import CoordonnateurHome from "./pages/Coordonnateur/CoordonnateurHome.jsx";
import DemandesValidation from "./pages/Coordonnateur/DemandesValidation.jsx";

import "./styles/global.css";
import Devis from "./pages/Coordonnateur/Devis.jsx";

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 20 }}>Chargement...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (user.id_role === 1) return <Navigate to="/admin" replace />;
  if (user.id_role === 2) return <Navigate to="/organisateur" replace />;
  if (user.id_role === 3) return <Navigate to="/coordonnateur" replace />;

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
              <Route
                path="admin/reservations"
                element={
                  <RoleGate allowedRoles={[1]}>
                    <Calendar />
                  </RoleGate>
                }
              />
              <Route
                path="admin/salles"
                element={
                  <RoleGate allowedRoles={[1]}>
                    <SallesPage />
                  </RoleGate>
                }
              />
              <Route
                path="admin/services"
                element={
                  <RoleGate allowedRoles={[1]}>
                    <ServicesPage />
                  </RoleGate>
                }
              />
              <Route
                path="admin/evenements"
                element={
                  <RoleGate allowedRoles={[1]}>
                    <EvenementsAdmin />
                  </RoleGate>
                }
              />

              {/* Organisateur */}
              <Route
                path="organisateur"
                element={
                  <RoleGate allowedRoles={[2]}>
                    <OrganisateurHome />
                  </RoleGate>
                }
              />
              <Route
                path="organisateur/reservations"
                element={
                  <RoleGate allowedRoles={[2]}>
                    <Calendar />
                  </RoleGate>
                }
              />
              <Route
                path="organisateur/evenements"
                element={
                  <RoleGate allowedRoles={[2]}>
                    <ListeEvenements />
                  </RoleGate>
                }
              />
              <Route
                path="organisateur/evenements/creer"
                element={
                  <RoleGate allowedRoles={[2]}>
                    <CreerEvenement />
                  </RoleGate>
                }
              />
              <Route
                path="organisateur/evenements/modifier/:id"
                element={
                  <RoleGate allowedRoles={[2]}>
                    <CreerEvenement />
                  </RoleGate>
                }
              />
              <Route
                path="organisateur/evenements/:id_evenement/services"
                element={
                  <RoleGate allowedRoles={[2]}>
                    <EvenementServices />
                  </RoleGate>
                }
              />
              <Route
                path="organisateur/demandes-services"
                element={
                  <RoleGate allowedRoles={[2]}>
                    <MesDemandesServices />
                  </RoleGate>
                }
              />

              {/* Coordinateur */}
              <Route
                path="coordonnateur"
                element={
                  <RoleGate allowedRoles={[3]}>
                    <CoordonnateurHome />
                  </RoleGate>
                }
              />
              <Route
                path="coordonnateur/demandes"
                element={
                  <RoleGate allowedRoles={[3]}>
                    <DemandesValidation />
                  </RoleGate>
                }
              />
              <Route
                  path="coordonnateur/Devis"
                  element={
                    <RoleGate allowedRoles={[3]}>
                      <Devis/>
                    </RoleGate>
                  }
                />

              <Route path="*" element={<Notfound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}