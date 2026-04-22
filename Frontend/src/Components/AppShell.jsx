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
              <NavLink to="/admin" end className={linkClass}>
                <span className="ico">
                  <FaChartBar />
                </span>
                Dashboard
              </NavLink>

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

              <NavLink to="/admin/facturation" className={linkClass}>
                <span className="ico">
                  <FaFileInvoiceDollar />
                </span>
                Facturation
              </NavLink>
            </>
          )}

          {isOrganisateur && (
            <>
              <NavLink to="/organisateur" end className={linkClass}>
                <span className="ico">
                  <FaChartBar />
                </span>
                Dashboard
              </NavLink>

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
            </>
          )}

          {isCoordonnateur && (
            <>
              <NavLink to="/coordonnateur" end className={linkClass}>
                <span className="ico">
                  <FaChartBar />
                </span>
                Dashboard
              </NavLink>

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
            </>
          )}

          {isCompta && (
            <>
              <NavLink to="/comptabilite" className={linkClass}>
                <span className="ico">
                  <FaChartBar />
                </span>
                Dashboard
              </NavLink>

              <NavLink to="/comptabilite/factures" className={linkClass}>
                <span className="ico">
                  <FaFileInvoiceDollar />
                </span>
                Factures
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