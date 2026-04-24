// src/pages/Coordinateur/CoordinateurHome.jsx
import React, { useEffect, useState } from "react";
import { apiFetch } from "../../Api/Client.jsx";
import "../../styles/dashboard.css";
import "../../styles/global.css";
import { useNavigate } from "react-router-dom";
import useAuth from "../../auth/UseAuth.jsx";
import {
  FaClipboardList,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaHistory,  
  FaChartLine
} from "react-icons/fa";

export default function CoordonnateurHome() {
  const [stats, setStats] = useState({
    total: 0,
    attente: 0,
    validees: 0,
    refusees: 0,
  });

  useEffect(() => {
    chargerStats();
  }, []);
  const navigate = useNavigate();
   const { user } = useAuth();

  async function chargerStats() {
    const { res, data } = await apiFetch("/api/evenementservices");

    if (!res.ok) return;

    const demandes = Array.isArray(data) ? data : [];

   setStats({
  total: demandes.length,
  attente: demandes.filter(
    (d) => (d.statut || "").toLowerCase() === "demande"
  ).length,
  validees: demandes.filter(
    (d) => (d.statut || "").toLowerCase() === "valide"
  ).length,
  refusees: demandes.filter(
    (d) => (d.statut || "").toLowerCase() === "refuse"
  ).length,
});
  }

  const cards = [
    {
      title: "Total des demandes",
      value: stats.total,
      color: "#1d4ed8",
      bg: "#dbeafe",
      icon: <FaClipboardList />,
    },
    {
      title: "Demandes en attente",
      value: stats.attente,
      color: "#b45309",
      bg: "#fef3c7",
      icon: <FaClock />,
    },
    {
      title: "Demandes validées",
      value: stats.validees,
      color: "#166534",
      bg: "#dcfce7",
      icon: <FaCheckCircle />,
    },
    {
      title: "Demandes refusées",
      value: stats.refusees,
      color: "#b91c1c",
      bg: "#fee2e2",
      icon: <FaTimesCircle />,
    },
  ];
  return (
<div className="page">
      <div className="dashWelcome">
        <h2>Bonjour{user?.prenom ? `, ${user.prenom}` : ""}</h2>
        <p className="dashWelcomeSub">
          Bienvenue sur votre espace coordonnateur. Suivez et validez les demandes de services depuis cette page.
        </p>
      </div>

      {/* 🔥 STATS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 18,
        }}
      >
        {cards.map((card) => (
          <div
            key={card.title}
            className="card"
            style={{
              padding: "24px",
              borderRadius: "20px",
              minHeight: "150px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: card.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                color: card.color,
              }}
            >
              {card.icon}
            </div>

            <div>
              <div
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  color: "#0f172a",
                  marginBottom: 12,
                }}
              >
                {card.title}
              </div>

              <div
                style={{
                  fontSize: "3rem",
                  fontWeight: 800,
                  lineHeight: 1,
                  color: card.color,
                }}
              >
                {card.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 🔥 AJOUT ICI (IMPORTANT) */}
      <div style={{ marginTop: "30px" }}>
        <h3 style={{ marginBottom: "15px" }}>Actions rapides</h3>

        <div className="dashGrid">
          <button
            className="dashCard"
            onClick={() => navigate("/coordonnateur/audit")}
          >
         <div className="dashIcon"><FaChartLine /></div>

            <div className="dashText">
              <div className="dashTitle">Audit</div>
              <div className="dashDesc">Historique des modifications</div>
            </div>

            <div className="dashBadge">Ouvrir</div>
          </button>
          <button
            className="dashCard"
            onClick={() => navigate("/coordonnateur/historique")}
          >
        <div className="dashIcon"><FaHistory /></div>

            <div className="dashText">
              <div className="dashTitle">Historique</div>
              <div className="dashDesc">Voir les événements passés</div>
            </div>

            <div className="dashBadge">Ouvrir</div>
          </button>
        </div>
      </div>
    </div>
  );
}
