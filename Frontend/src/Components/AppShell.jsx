// src/Components/AppShell.jsx
import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import useAuth from "../auth/UseAuth.jsx";
import "../styles/shell.css";
import NotificationBell from "./NotificationBell.jsx";
import NotificationPreferences from "./NotificationPreferences.jsx";

// Icônes
import {
  FaChartBar,
  FaUsers,
  FaCalendarAlt,
  FaFileInvoiceDollar,
  FaCalendar,
  FaDoorOpen,
  FaConciergeBell,
  FaEnvelopeOpenText,
  FaBell,
  FaHistory,
} from "react-icons/fa";

function roleLabel(id_role) {
  if (id_role === 1) return "Administrateur";
  if (id_role === 2) return "Organisateur";
  if (id_role === 3) return "Coordonnateur";
  if (id_role === 4) return "Comptabilité";
  return "Utilisateur";
}

function linkClass({ isActive }) {
  return isActive ? "link active" : "link";
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const isAdmin = user?.id_role === 1;
  const isOrganisateur = user?.id_role === 2;
  const isCoordonnateur = user?.id_role === 3;
  const isCompta = user?.id_role === 4;

  const [showNotifPrefs, setShowNotifPrefs] = useState(false);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandTitle">Hôtel La Promenade</div>
          <div className="brandSub">Gestion des événements</div>
        </div>

        <nav className="menu">
          {isAdmin && (
            <>
              <div className="menuCategory">Navigation</div>
              <NavLink to="/admin" end className={linkClass}>
                <span className="ico">
                  <FaChartBar />
                </span>
                Dashboard
              </NavLink>

              <div className="menuCategory">Administration</div>
              <NavLink to="/admin/users" className={linkClass}>
                <span className="ico">
                  <FaUsers />
                </span>
                Utilisateurs et rôles
              </NavLink>

              <NavLink to="/admin/salles" className={linkClass}>
                <span className="ico">
                  <FaDoorOpen />
                </span>
                Salles
              </NavLink>

              <NavLink to="/admin/services" className={linkClass}>
                <span className="ico">
                  <FaConciergeBell />
                </span>
                Services
              </NavLink>

              <NavLink to="/admin/evenements" className={linkClass}>
                <span className="ico">
                  <FaCalendarAlt />
                </span>
                Événements
              </NavLink>

              <NavLink to="/admin/historique" className={linkClass}>
                <span className="ico"><FaHistory /></span>
                Historique
              </NavLink>
            </>
          )}

          {isOrganisateur && (
            <>
              <div className="menuCategory">Navigation</div>
              <NavLink to="/organisateur" end className={linkClass}>
                <span className="ico">
                  <FaChartBar />
                </span>
                Dashboard
              </NavLink>

              <div className="menuCategory">Gestion</div>
              <NavLink to="/organisateur/evenements" className={linkClass}>
                <span className="ico">
                  <FaCalendarAlt />
                </span>
                Événements
              </NavLink>

              <NavLink to="/organisateur/reservations" className={linkClass}>
                <span className="ico">
                  <FaCalendar />
                </span>
                Réservations
              </NavLink>

              <NavLink to="/organisateur/invites" className={linkClass}>
                <span className="ico">
                  <FaEnvelopeOpenText />
                </span>
                Invités
              </NavLink>

              <div className="menuCategory">Historique</div>
              <NavLink to="/organisateur/historique" className={linkClass}>
                <span className="ico"><FaHistory /></span>
                Historique
              </NavLink>
            </>
          )}

          {isCoordonnateur && (
            <>
              <div className="menuCategory">Navigation</div>
              <NavLink to="/coordonnateur" end className={linkClass}>
                <span className="ico">
                  <FaChartBar />
                </span>
                Dashboard
              </NavLink>

              <div className="menuCategory">Gestion</div>
              <NavLink to="/coordonnateur/demandes" className={linkClass}>
                <span className="ico">
                  <FaConciergeBell />
                </span>
                Gestion des demandes
              </NavLink>

              <NavLink to="/coordonnateur/devis" className={linkClass}>
                <span className="ico">
                  <FaFileInvoiceDollar />
                </span>
                Devis
              </NavLink>

              <div className="menuCategory">Historique</div>
              <NavLink to="/coordonnateur/historique" className={linkClass}>
                <span className="ico"><FaHistory /></span>
                Historique
              </NavLink>

              <NavLink to="/coordonnateur/audit" className={linkClass}>
                <span className="ico"><FaHistory /></span>
                Audit modifications
              </NavLink>
            </>
          )}

          {isCompta && (
            <>
              <div className="menuCategory">Navigation</div>
              <NavLink to="/comptabilite" end className={linkClass}>
                <span className="ico">
                  <FaChartBar />
                </span>
                Dashboard
              </NavLink>

              <div className="menuCategory">Gestion</div>
              <NavLink to="/comptabilite/factures" className={linkClass}>
                <span className="ico">
                  <FaFileInvoiceDollar />
                </span>
                Factures
              </NavLink>

              <div className="menuCategory">Historique</div>
              <NavLink to="/comptabilite/historique" className={linkClass}>
                <span className="ico"><FaHistory /></span>
                Historique
              </NavLink>
            </>
          )}

          <button
            type="button"
            className="link prefsBtn"
            onClick={() => setShowNotifPrefs(true)}
          >
            <span className="ico">
              <FaBell />
            </span>
            Préférences notifications
          </button>
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="userInfo">
            <div className="userName">
              {user?.prenom} {user?.nom}
            </div>
            <div className="userRole">{roleLabel(user?.id_role)}</div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <NotificationBell />
            <button className="btn btnGhost" type="button" onClick={logout}>
              Déconnexion
            </button>
          </div>
        </header>

        <div className="content">
          <Outlet />
        </div>

        <footer className="appFooter">
          <span>© {new Date().getFullYear()} Hôtel La Promenade — Tous droits réservés</span>
          <span>Plateforme interne de gestion des événements</span>
        </footer>
      </main>

      {showNotifPrefs && (
        <div
          className="modalOverlay"
          onClick={() => setShowNotifPrefs(false)}
        >
          <div
            className="modalCard"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="modalClose"
              onClick={() => setShowNotifPrefs(false)}
            >
              ×
            </button>

            <NotificationPreferences />
          </div>
        </div>
      )}
    </div>
  );
}