import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/dashboard.css";

import {
  FaUsers,
  FaDoorOpen,
  FaConciergeBell,
  FaTags,
  FaChartLine,
} from "react-icons/fa";

export default function OrganisateurHome() {
  const navigate = useNavigate();

  const actions = [
    {
      title: "Mes clients",
      desc: "Liste & gestion des clients",
      icon: <FaUsers />,
      to: "/organisateur/clients",
      enabled: true,
    },
    {
      title: "Salles",
      desc: "Capacités, équipements",
      icon: <FaDoorOpen />,
      to: "/organisateur/salles",
      enabled: true,
    },
    {
      title: "Services",
      desc: "Catalogue & options",
      icon: <FaConciergeBell />,
      to: "/organisateur/services",
      enabled: true,
    },
    {
      title: "Tarification",
      desc: "Prix & promotions",
      icon: <FaTags />,
      to: "/organisateur/tarifs",
      enabled: false,
    },
    {
      title: "Statistiques",
      desc: "Vue globale",
      icon: <FaChartLine />,
      to: "/organisateur/stats",
      enabled: false,
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
