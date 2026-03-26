// src/pages/Coordinateur/CoordinateurHome.jsx
import React, { useEffect, useState } from "react";
import { apiFetch } from "../../Api/Client.jsx";
import "../../styles/dashboard.css";
import "../../styles/global.css";

import {
  FaClipboardList,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
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
      <div className="pageHeader">
        <h2>Dashboard Coordonnateur</h2>
        <p className="muted">
          Suivi global des demandes de services des organisateurs.
        </p>
      </div>

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
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              cursor: "default",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
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
    </div>
  );
}