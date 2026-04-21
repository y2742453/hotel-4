import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/dashboard.css";

import {
  FaEnvelopeOpenText,
  FaCalendar,
  FaCalendarAlt,
  FaChartLine,
} from "react-icons/fa";

import "chart.js/auto";
import { Pie, Bar } from "react-chartjs-2";

export default function OrganisateurHome() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    date_debut: "",
    date_fin: "",
  });

  // 🔥 appel backend
  useEffect(() => {
    axios
      .get("http://localhost:5001/api/dashboard", {
        params: filters,
        withCredentials: true,
      })
      .then((res) => {
        setStats(res.data);
      })
      .catch((err) => console.error(err));
  }, [filters]);

  const pieData = stats
    ? {
        labels: ["Confirmés", "Autres"],
        datasets: [
          {
            data: [
              stats.confirmedGuests,
              stats.totalGuests - stats.confirmedGuests,
            ],
          },
        ],
      }
    : null;

  const barData = stats
    ? {
        labels: ["Invités", "Confirmés"],
        datasets: [
          {
            label: "Statistiques",
            data: [stats.totalGuests, stats.confirmedGuests],
          },
        ],
      }
    : null;

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
    {
      title: "Historique",
      desc: "Voir les événements passés",
      icon: <FaChartLine />,
      to: "/organisateur/historique",
      enabled: true,
    },
  ];
  const exportExcel = () => {
    window.open("http://localhost:5001/api/dashboard/export/excel", "_blank");
  };

  const exportPDF = () => {
    window.open("http://localhost:5001/api/dashboard/export/pdf", "_blank");
  };

  return (
    <div className="page">
      <div className="pageHeader">
        <h2>📊 Dashboard Organisateur</h2>
        <p className="muted">Analyse rapide de vos événements</p>
      </div>
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <input
          type="date"
          value={filters.date_debut}
          onChange={(e) =>
            setFilters({ ...filters, date_debut: e.target.value })
          }
        />

        <input
          type="date"
          value={filters.date_fin}
          onChange={(e) => setFilters({ ...filters, date_fin: e.target.value })}
        />
      </div>
      <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        <button onClick={exportExcel} className="exportBtn">
          📊 Export Excel
        </button>

        <button onClick={exportPDF} className="exportBtn">
          📄 Export PDF
        </button>
      </div>

      {/* 🔥 STATS */}
      {stats && (
        <div className="statsGrid">
          <div className="statCard">
            <FaChartLine />
            <h3>{stats.totalEvents}</h3>
            <p>Événements</p>
          </div>

          <div className="statCard">
            <h3>{stats.totalGuests}</h3>
            <p>Invités</p>
          </div>

          <div className="statCard">
            <h3>{stats.confirmedGuests}</h3>
            <p>Confirmés</p>
          </div>

          <div className="statCard">
            <h3>{stats.totalCost} $</h3>
            <p>Coût total</p>
          </div>
        </div>
      )}

      {stats && (
        <div style={{ display: "flex", gap: "30px", marginTop: "30px" }}>
          <div style={{ width: "300px" }}>
            <h3>Participation</h3>
            <Pie data={pieData} />
          </div>

          <div style={{ width: "400px" }}>
            <h3>Comparaison</h3>
            <Bar data={barData} />
          </div>
        </div>
      )}

      {/* 🔥 ACTIONS */}
      <div className="dashGrid">
        {actions.map((a) => (
          <button
            key={a.title}
            type="button"
            className={a.enabled ? "dashCard" : "dashCard dashCardDisabled"}
            onClick={() => a.enabled && navigate(a.to)}
            disabled={!a.enabled}
          >
            <div className="dashIcon">{a.icon}</div>
            <div className="dashText">
              <div className="dashTitle">{a.title}</div>
              <div className="dashDesc">{a.desc}</div>
            </div>
            <div className="dashBadge">Ouvrir</div>
          </button>
        ))}
      </div>
    </div>
  );
}
