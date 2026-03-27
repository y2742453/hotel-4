import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/dashboard.css";

import {
  FaUsers,
  FaEnvelopeOpenText,
  FaDoorOpen,
  FaConciergeBell,
  FaTags,
  FaChartLine,
  FaCalendar,
  FaCalendarAlt,
} from "react-icons/fa";

export default function OrganisateurHome() {
  const navigate = useNavigate();

  const actions = [
    {
      title: "Événements",
      desc: "Créer un evenement",
      icon: <FaCalendarAlt />,
      to: "/organisateur/evenements",
      enabled: true,
    },
    {
      title: "Reservations",
      desc: "Gestion des réservations",
      icon: <FaCalendar />,
      to: "/organisateur/reservations",
      enabled: true,
    },
    {
      title: "Invités",
      desc: "Gestion des invités",
      icon: <FaEnvelopeOpenText />,
      to: "/organisateur/invites",
      enabled: true,
    },
  ];

  return (
    <div className="page">
      <div className="pageHeader">
        <h2>Dashboard Organisateur</h2>
        <p className="muted">Accès rapide aux fonctionnalités principales.</p>
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
