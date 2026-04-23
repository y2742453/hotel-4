import { useEffect, useState } from "react";
import { apiFetch } from "../../Api/Client.jsx";
import "../../styles/dashboard.css";

export default function ComptabiliteHistorique() {
  const [factures, setFactures] = useState([]);

  useEffect(() => {
    async function fetchFactures() {
      const { res, data } = await apiFetch("/api/factures");
      if (res.ok) setFactures(data);
    }
    fetchFactures();
  }, []);

  return (
    <div className="page">
      <div className="pageHeader">
        <h2>📜 Historique des opérations comptables</h2>
        <p className="muted">
          Consultez toutes les factures et paiements passés
        </p>
      </div>

      {factures.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Montant total</th>
              <th>Taxes</th>
              <th>Statut</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {factures.map((f) => (
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
      ) : (
        <p>Aucune opération comptable trouvée</p>
      )}
    </div>
  );
}
