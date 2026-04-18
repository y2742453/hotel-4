import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../../Api/Client.jsx";
import "../../styles/factures.css";

export default function FacturePDF() {
  const { id } = useParams();
  const [facture, setFacture] = useState(null);

  useEffect(() => {
    loadFacture();
  }, [id]);

  async function loadFacture() {
    const { res, data } = await apiFetch(`/api/factures/${id}`);
    if (res.ok) {
      setFacture(data);
    } else {
      console.error(data);
    }
  }
  function handlePrint() {
    setTimeout(() => {
      window.print();
    }, 300);
  }

  if (!facture) return <p>Chargement...</p>;

  const total = Number(facture.montant_total || 0) + Number(facture.taxes || 0);

  return (
    <div className="invoicePage">
      {/* TOP BAR */}
      <div className="invoiceTopActions no-print">
        <button onClick={handlePrint}>Télécharger PDF</button>
      </div>

      {/* INVOICE */}
      <div className="invoiceContainer printArea">
        {/* HEADER */}
        <div className="invoiceHeader">
          <div>
            <h1>Hôtel La Promenade</h1>
            <p>Facture officielle</p>
          </div>

          <div className="invoiceMetaRight">
            <h2>FACTURE</h2>
            <p># {facture.id_facture}</p>
            <p>{new Date(facture.date_facture).toLocaleDateString()}</p>
            <p className={`status ${facture.statut}`}>{facture.statut}</p>
          </div>
        </div>

        {/* INFO BLOCK */}
        <div className="invoiceGrid">
          <div>
            <h3>Détails</h3>
            <p>
              Événement ID: {facture.id_evenement} - {facture.nom_evenement}
            </p>
            <p>Client: Organisateur</p>
          </div>

          <div>
            <h3>Paiement</h3>
            <p>TVA: 15%</p>
            <p>Statut: {facture.statut}</p>
          </div>
        </div>

        {/* TABLE */}
        <table className="invoiceTable">
          <thead>
            <tr>
              <th>Description</th>
              <th>Montant</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Location salle + services</td>
              <td>{Number(facture.montant_total).toFixed(2)} $</td>
            </tr>

            <tr>
              <td>Taxes (TVA 15%)</td>
              <td>{Number(facture.taxes).toFixed(2)} $</td>
            </tr>
          </tbody>
        </table>

        {/* TOTAL */}
        <div className="invoiceTotal">
          <h3>Total TTC</h3>
          <h2>{total.toFixed(2)} $</h2>
        </div>

        {/* FOOTER */}
        <div className="invoiceFooter">
          Hôtel La Promenade — Facture générée automatiquement
        </div>
      </div>
    </div>
  );
}
