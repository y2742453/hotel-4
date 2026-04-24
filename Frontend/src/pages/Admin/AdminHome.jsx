// src/pages/Admin/AdminHome.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/dashboard.css";
import useAuth from "../../auth/UseAuth.jsx";
import {
  FaUsers,
  FaUserShield,
  FaCogs,
  FaDoorOpen,
  FaConciergeBell,
  FaTags,
  FaChartLine,
  FaListAlt,
  FaCalendar,
  FaCalendarAlt,
  FaEnvelopeOpenText,
  FaHistory,
} from "react-icons/fa";

export default function AdminHome() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const actions = [
    {
      title: "Gestion des utilisateurs",
      desc: "Créer, modifier, désactiver, supprimer",
      icon: <FaUsers />,
      to: "/admin/users",
      enabled: true,
    },
    {
      title: "Gestion des salles",
      desc: "Capacités, équipements",
      icon: <FaDoorOpen />,
      to: "/admin/salles",
      enabled: true,
    },
    {
      title: "Gestion des services",
      desc: "Catalogue & options",
      icon: <FaConciergeBell />,
      to: "/admin/services",
      enabled: true,
    },
    {
      title: "Événements",
      desc: "Créer un evenement",
      icon: <FaCalendarAlt />,
      to: "/admin/evenements",
      enabled: true,
    },
    {
      title: "Historique",
      desc: "Voir les événements passés",
      icon: <FaHistory />,
      to: "/admin/historique",
      enabled: true,
    },
  ];

  return (
    <div className="page">
      <div className="dashWelcome">
        <h2>Bonjour{user?.prenom ? `, ${user.prenom}` : ""}</h2>
        <p className="dashWelcomeSub">
          Bienvenue sur votre espace administrateur. Gérez les utilisateurs, salles et services depuis cette page.
        </p>
      </div>

      <div className="dashGrid">
        {actions.map((a) => (
          <button
            key={a.title}
            type="button"
            className={a.enabled ? "dashCard" : "dashCard dashCardDisabled"}
            onClick={() => a.enabled && navigate(a.to)}
            disabled={!a.enabled}
            title={!a.enabled ? "À venir" : "Ouvrir"}
          >
            <div className="dashIcon">{a.icon}</div>
            <div className="dashText">
              <div className="dashTitle">{a.title}</div>
              <div className="dashDesc">{a.desc}</div>
            </div>
            <div className="dashBadge">{a.enabled ? "Ouvrir" : "À venir"}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
