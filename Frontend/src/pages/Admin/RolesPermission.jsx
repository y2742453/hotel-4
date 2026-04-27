// src/pages/Admin/RolesPermissionsPage.jsx
import React from "react";
import "../../styles/table.css";

export default function RolesPermissionsPage() {
  return (
    <div>
      <h2>Gestion des rôles et permissions</h2>
      <p style={{ marginTop: 8 }}>
        Sprint 1 : affichage des rôles. Sprint 2 : édition des permissions.
      </p>

      <div className="tableWrap" style={{ marginTop: 16 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Rôle</th>
              <th>Permissions principales</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Administrateur</td>
              <td>Comptes, rôles, paramètres, salles, services, tarifs</td>
            </tr>
            <tr>
              <td>Organisateur</td>
              <td>Créer événements, invités, services, factures, rapports</td>
            </tr>
            <tr>
              <td>Coordonnateur</td>
              <td>Valider / planifier les services et coordination</td>
            </tr>
            <tr>
              <td>Comptabilité</td>
              <td>Facturation, paiements, taxes, retards</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
