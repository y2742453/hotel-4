import React, { useEffect, useState } from "react";
import { apiFetch } from "../../Api/Client.jsx";
import "../../styles/dashboard.css";
import "../../styles/global.css";
import useAuth from "../../auth/UseAuth.jsx";


import {
  FaMoneyBillWave,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaFileInvoiceDollar,
  FaPercentage,
} from "react-icons/fa";

export default function ComptabiliteHome() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pending: 0,
    paid: 0,
    overdue: 0,
    tva: 0,
  });

  const [factures, setFactures] = useState([]);

  useEffect(() => {
    loadStats();
    loadFactures();
  }, []);
  const { user } = useAuth();

  async function loadStats() {
    const { res, data } = await apiFetch("/api/factures");

    if (!res.ok) return;

    const list = Array.isArray(data) ? data : [];

    const totalRevenue = list
      .filter((f) => f.statut === "paye")
      .reduce((acc, f) => acc + Number(f.montant_total), 0);

    const tva = list
      .filter((f) => f.statut === "paye")
      .reduce((acc, f) => acc + Number(f.taxes), 0);

    setStats({
      totalRevenue,
      pending: list.filter((f) => f.statut === "en_attente").length,
      paid: list.filter((f) => f.statut === "paye").length,
      overdue: list.filter((f) => f.statut === "en_retard").length,
      tva,
    });
  }

  async function loadFactures() {
    const { res, data } = await apiFetch("/api/factures");
    if (res.ok) setFactures(data);
  }

  const cards = [
    {
      title: "Revenu total",
      value: `${stats.totalRevenue.toFixed(2)} $`,
      icon: <FaMoneyBillWave />,
      color: "#16a34a",
      bg: "#dcfce7",
    },
    {
      title: "Factures en attente",
      value: stats.pending,
      icon: <FaClock />,
      color: "#b45309",
      bg: "#fef3c7",
    },
    {
      title: "Factures payées",
      value: stats.paid,
      icon: <FaCheckCircle />,
      color: "#2563eb",
      bg: "#dbeafe",
    },
    {
      title: "Factures en retard",
      value: stats.overdue,
      icon: <FaExclamationTriangle />,
      color: "#dc2626",
      bg: "#fee2e2",
    },
    {
      title: "TVA collectée",
      value: `${stats.tva.toFixed(2)} $`,
      icon: <FaPercentage />,
      color: "#7c3aed",
      bg: "#ede9fe",
    },
  ];

  return (
    <div className="page">
      <div className="dashWelcome">
        <h2>Bonjour{user?.prenom ? `, ${user.prenom}` : ""}</h2>
        <p className="dashWelcomeSub">
          Bienvenue sur votre espace comptabilité. Suivez les factures, paiements et revenus depuis cette page.
        </p>
      </div>

      {/* KPI CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 18,
        }}
      >
        {cards.map((c) => (
          <div key={c.title} className="card" style={{ padding: 22 }}>
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: 14,
                background: c.bg,
                color: c.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.4rem",
              }}
            >
              {c.icon}
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 14, color: "#64748b" }}>{c.title}</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* RECENT FACTURES */}
      <div className="card" style={{ marginTop: 24 }}>
        <h3>Dernières factures</h3>

        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Total</th>
              <th>Taxes</th>
              <th>Statut</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {factures.slice(0, 8).map((f) => (
              <tr key={f.id_facture}>
                <td>#{f.id_facture}</td>
                <td>{f.montant_total} $</td>
                <td>{f.taxes} $</td>
                <td>{f.statut}</td>
                <td>
                  {f.date_facture
                    ? new Date(f.date_facture).toLocaleDateString()
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
