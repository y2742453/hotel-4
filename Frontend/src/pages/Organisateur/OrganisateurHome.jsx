import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useAuth from "../../auth/UseAuth.jsx";
import "../../styles/dashboard.css";

import {
  FaEnvelopeOpenText,
  FaCalendar,
  FaCalendarAlt,
  FaChartLine,
  FaUsers,
  FaCheckCircle,
  FaDollarSign,
  FaLayerGroup,
  FaFileExcel,
  FaFilePdf,
} from "react-icons/fa";

import "chart.js/auto";
import { Pie, Bar } from "react-chartjs-2";

export default function OrganisateurHome() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ date_debut: "", date_fin: "" });

  useEffect(() => {
    axios
      .get("https://hotel-la-promenade.vercel.app/api/dashboard", {
        params: filters,
        withCredentials: true,
      })
      .then((res) => setStats(res.data))
      .catch((err) => console.error(err));
  }, [filters]);

  /* ── Graphiques ── */
  const pieData = stats
    ? {
        labels: ["Confirmés", "Autres"],
        datasets: [
          {
            data: [
              stats.confirmedGuests,
              stats.totalGuests - stats.confirmedGuests,
            ],
            backgroundColor: ["#22c55e", "#1f4db8"],
            borderWidth: 0,
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
            backgroundColor: ["#1f4db8", "#22c55e"],
            borderRadius: 8,
          },
        ],
      }
    : null;

  /* ── Cartes d'accès rapide ── */
  const actions = [
    {
      title: "Événements",
      desc: "Créer un événement",
      icon: <FaCalendarAlt />,
      to: "/organisateur/evenements",
    },
    {
      title: "Réservations",
      desc: "Gestion des réservations",
      icon: <FaCalendar />,
      to: "/organisateur/reservations",
    },
    {
      title: "Invités",
      desc: "Gestion des invités",
      icon: <FaEnvelopeOpenText />,
      to: "/organisateur/invites",
    },
    {
      title: "Historique",
      desc: "Voir les événements passés",
      icon: <FaChartLine />,
      to: "/organisateur/historique",
    },
  ];

  /* ── Cartes de stats ── */
  const statCards = stats
    ? [
        {
          label: "Événements",
          value: stats.totalEvents,
          icon: <FaLayerGroup />,
          color: "#1f4db8",
          bg: "#eaf1ff",
        },
        {
          label: "Invités au total",
          value: stats.totalGuests,
          icon: <FaUsers />,
          color: "#7c3aed",
          bg: "#f3eeff",
        },
        {
          label: "Confirmés",
          value: stats.confirmedGuests,
          icon: <FaCheckCircle />,
          color: "#15803d",
          bg: "#dcfce7",
        },
        {
          label: "Coût total",
          value: Number(stats.totalCost || 0).toLocaleString("fr-CA", {
            style: "currency",
            currency: "CAD",
            maximumFractionDigits: 0,
          }),
          icon: <FaDollarSign />,
          color: "#b45309",
          bg: "#fef3c7",
        },
      ]
    : [];

  const exportExcel = () =>
    window.open(
      "https://hotel-la-promenade.vercel.app/api/dashboard/export/excel",
      "_blank",
    );

  const exportPDF = () =>
    window.open(
      "https://hotel-la-promenade.vercel.app/api/dashboard/export/pdf",
      "_blank",
    );

  return (
    <div className="page">
      {/* ══ BIENVENUE ══ */}
      <div className="dashWelcome">
        <div className="dashWelcomeText">
          <h2>Bonjour{user?.prenom ? `, ${user.prenom}` : ""}</h2>
          <p className="dashWelcomeSub">
            Voici un aperçu de vos activités. Gérez vos événements, invités et
            réservations depuis cette page.
          </p>
        </div>
      </div>

      {/* ══ ACCÈS RAPIDE ══ */}
      <div className="dashSectionLabel">Accès rapide</div>
      <div className="dashGrid">
        {actions.map((a) => (
          <button
            key={a.title}
            type="button"
            className="dashCard"
            onClick={() => navigate(a.to)}
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

      {/* ══ STATISTIQUES ══ */}
      <div className="dashSectionLabel" style={{ marginTop: "32px" }}>
        Statistiques générales
      </div>

      {/* Filtres + exports */}
      <div className="dashControls">
        <div className="dashFiltersGroup">
          <span className="dashFilterLabel">Période :</span>
          <input
            type="date"
            value={filters.date_debut}
            onChange={(e) =>
              setFilters({ ...filters, date_debut: e.target.value })
            }
          />
          <span className="dashFilterSep">→</span>
          <input
            type="date"
            value={filters.date_fin}
            onChange={(e) =>
              setFilters({ ...filters, date_fin: e.target.value })
            }
          />
        </div>
        <div className="dashExports">
          <button onClick={exportExcel} className="exportBtn exportBtnExcel">
            <FaFileExcel />
            Exporter en Excel
          </button>
          <button onClick={exportPDF} className="exportBtn exportBtnPDF">
            <FaFilePdf />
            Exporter en PDF
          </button>
        </div>
      </div>

      {/* Cartes stats */}
      {stats ? (
        <div className="statsGrid">
          {statCards.map((s) => (
            <div className="statCard" key={s.label}>
              <div
                className="statCardIcon"
                style={{ background: s.bg, color: s.color }}
              >
                {s.icon}
              </div>
              <div className="statCardBody">
                <div className="statCardValue">{s.value}</div>
                <div className="statCardLabel">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="dashEmpty">Chargement des statistiques…</p>
      )}

      {/* ══ GRAPHIQUES ══ */}
      {stats && (
        <>
          <div className="dashSectionLabel" style={{ marginTop: "32px" }}>
            Visualisation
          </div>
          <div className="chartsRow">
            <div className="chartBox pie">
              <div className="chartBoxHeader">
                <span className="chartBoxTitle">Participation des invités</span>
                <span className="chartBoxSub">
                  {stats.confirmedGuests} confirmés sur {stats.totalGuests}
                </span>
              </div>
              <Pie
                data={pieData}
                options={{
                  plugins: { legend: { position: "bottom" } },
                  maintainAspectRatio: true,
                }}
              />
            </div>

            <div className="chartBox bar">
              <div className="chartBoxHeader">
                <span className="chartBoxTitle">Invités vs Confirmés</span>
                <span className="chartBoxSub">Tous événements confondus</span>
              </div>
              <Bar
                data={barData}
                options={{
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true } },
                  maintainAspectRatio: true,
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
