// src/pages/Admin/AdminHome.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/dashboard.css";

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
} from "react-icons/fa";

export default function AdminHome() {
  const navigate = useNavigate();

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
      title: "Reservations",
      desc: "Reserver une salle",
      icon: <FaCalendar />,
      to: "/admin/reservations",
      enabled: true,
    },
    {
      title: "Invités",
      desc: "Gestion des invités",
      icon: <FaEnvelopeOpenText />,
      to: "/admin/invites",
      enabled: true,
    },
    {
      title: "Tarification",
      desc: "Prix & promotions",
      icon: <FaTags />,
      to: "/admin/tarifs",
      enabled: false,
    },
    {
      title: "Paramètres",
      desc: "Réglages de la plateforme",
      icon: <FaCogs />,
      to: "/admin/params",
      enabled: false,
    },
    {
      title: "Logs / Sécurité",
      desc: "Connexions et alertes",
      icon: <FaListAlt />,
      to: "/admin/logs",
      enabled: false,
    },
    {
      title: "Statistiques",
      desc: "Vue globale",
      icon: <FaChartLine />,
      to: "/admin/stats",
      enabled: false,
    },
  ];

  return (
    <div className="page">
      <div className="pageHeader">
        <h2>Dashboard Administrateur</h2>
        <p className="muted">
          Vue globale et accès rapide aux fonctionnalités.
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
