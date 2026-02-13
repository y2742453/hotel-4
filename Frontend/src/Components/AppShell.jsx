// src/Components/AppShell.jsx
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import useAuth from '../auth/UseAuth.jsx';
import '../styles/shell.css';

const roleLabel = (id_role) => {
  // adapte à ta table roles
  if (id_role === 1) return 'Administrateur';
  if (id_role === 2) return 'Organisateur';
  if (id_role === 3) return 'Coordonnateur';
  if (id_role === 4) return 'Comptabilité';
  return 'Utilisateur';
};

export default function AppShell() {
  const { user, logout } = useAuth();

  // Menu selon rôle
  const isAdmin = user?.id_role === 1;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandTitle">Hôtel La Promenade</div>
          <div className="brandSub">Gestion des événements</div>
        </div>

        <nav className="menu">
          {isAdmin ? (
            <>
              <NavLink to="/admin" className="link">Dashboard</NavLink>
              <NavLink to="/admin/users" className="link">Utilisateurs</NavLink>
              <NavLink to="/admin/roles" className="link">Rôles & permissions</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/app" className="link">Mon espace</NavLink>
            </>
          )}
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="userInfo">
            <div className="userName">{user?.prenom} {user?.nom}</div>
            <div className="userRole">{roleLabel(user?.id_role)}</div>
          </div>

          <button className="btn btnGhost" onClick={logout}>
            Déconnexion
          </button>
        </header>

        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
