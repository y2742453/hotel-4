// src/pages/Admin/AdminHome.jsx
import React from "react";
import { Link } from "react-router-dom";
import "../../styles/shell.css";

export default function AdminHome() {
  return (
    <div>
      <h2>Dashboard Administrateur</h2>
      <p className="muted">
        Ici vous gérez l'hotel
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
        <Link className="btn btnPrimary" to="/admin/users">Gérer les utilisateurs</Link>
        <Link className="btn btnGhost" to="/admin/roles">Rôles & permissions</Link>
      </div>
    </div>
  );
}
