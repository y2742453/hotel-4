import { useEffect, useState } from "react";
import { apiFetch } from "../../Api/Client.jsx";
import "../../styles/dashboard.css";
import "../../styles/global.css";

export default function Factures() {
  const [factures, setFactures] = useState([]);
  const [selectedFacture, setSelectedFacture] = useState(null);

  const [evenements, setEvenements] = useState([]);

  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    id_evenement: "",
    date_facture: "",
  });

  useEffect(() => {
    loadFactures();
    loadEvenements();
  }, []);

  const filteredFactures = factures.filter((f) => {
    const matchEvent =
      !filters.id_evenement ||
      String(f.id_evenement) === String(filters.id_evenement);

    const matchDate =
      !filters.date_facture ||
      new Date(f.date_facture) >= new Date(filters.date_facture);

    return matchEvent && matchDate;
  });

  async function loadEvenements() {
    const { res, data } = await apiFetch("/api/evenements");
    if (res.ok) setEvenements(data || []);
  }

  async function loadFactures() {
    setLoading(true);
    const { res, data } = await apiFetch("/api/factures");

    if (res.ok) setFactures(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function payerFacture(id_facture) {
    const { res, data } = await apiFetch(`/api/factures/payer/${id_facture}`, {
      method: "POST",
    });

    if (res.ok && data?.url) {
      window.location.href = data.url;
    } else {
      alert(data?.error || "Erreur paiement");
    }
  }

  function downloadPDF() {
    const content = document.querySelector(".printArea");

    if (!content) return;

    const win = window.open("", "", "width=900,height=700");

    win.document.write(`
    <html>
      <head>
        <title>${selectedFacture.type === "receipt" ? "Reçu" : "Facture"}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            color: #0f172a;
          }

          h1, h2, h3 {
            margin: 0;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }

          td, th {
            border: 1px solid #ddd;
            padding: 10px;
          }

          .invoiceHeader {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
          }

          .invoiceFooter {
            margin-top: 30px;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
    </html>
  `);

    win.document.close();

    win.onload = () => {
      win.focus();
      win.print();
      win.close();
    };
  }

  function openInvoice(facture) {
    setSelectedFacture({ ...facture, type: "invoice" });
  }

  function openReceipt(facture) {
    setSelectedFacture({ ...facture, type: "receipt" });
  }

  function InvoiceUI({ facture }) {
    const total = Number(facture.montant_total) + Number(facture.taxes);

    return (
      <>
        <div className="invoiceHeader">
          <div>
            <h1>Hôtel La Promenade</h1>
            <p>Facture officielle</p>
          </div>

          <div className="invoiceMetaRight">
            <h2>FACTURE</h2>
            <p>#{facture.id_facture}</p>
            <p>{new Date(facture.date_facture).toLocaleDateString()}</p>
            <p className={`status ${facture.statut}`}>{facture.statut}</p>
          </div>
        </div>

        <div className="invoiceGrid">
          <div>
            <h3>Détails</h3>
            <p>
              Événement: {facture.id_evenement} - {facture.nom_evenement}
            </p>
          </div>

          <div>
            <h3>Paiement</h3>
            <p>TVA: 13%</p>
          </div>
        </div>

        <table className="invoiceTable">
          <tbody>
            <tr>
              <td>Montant</td>
              <td>{Number(facture.montant_total).toFixed(2)} $</td>
            </tr>

            <tr>
              <td>Taxes</td>
              <td>{Number(facture.taxes).toFixed(2)} $</td>
            </tr>
          </tbody>
        </table>

        <div className="invoiceTotal">
          <h3>Total TTC</h3>
          <h2>{total.toFixed(2)} $</h2>
        </div>

        <div className="invoiceFooter">
          Hôtel La Promenade — Généré automatiquement
        </div>
      </>
    );
  }

  function ReceiptUI({ facture }) {
    return (
      <>
        {/* HEADER */}
        <div className="invoiceHeader">
          <div>
            <h1>Hôtel La Promenade</h1>
            <p>Reçu de paiement</p>
          </div>

          <div className="invoiceMetaRight">
            <h2>REÇU</h2>
            <p># {facture.id_facture}</p>
            <p>{new Date().toLocaleDateString()}</p>
            <p className="status paye">PAYÉ</p>
          </div>
        </div>

        {/* INFO */}
        <div className="invoiceGrid">
          <div>
            <h3>Client</h3>
            <p>Organisateur</p>
          </div>

          <div>
            <h3>Paiement</h3>
            <p>Stripe</p>
            <p>ID: {facture.stripe_payment_intent || "—"}</p>
          </div>
        </div>

        {/* TABLE */}
        <table className="invoiceTable">
          <tbody>
            <tr>
              <td>Montant payé</td>
              <td>
                {(
                  Number(facture.montant_total) + Number(facture.taxes)
                ).toFixed(2)}
                $
              </td>
            </tr>
          </tbody>
        </table>

        {/* FOOTER */}
        <div className="invoiceFooter">
          Paiement confirmé — merci pour votre confiance.
        </div>
      </>
    );
  }

  function handlePrint() {
    setTimeout(() => {
      window.print();
    }, 300);
  }

  function resetFilters() {
    setFilters({
      id_evenement: "",
      date_facture: "",
    });

    loadFactures();
  }

  function getStatusColor(status) {
    switch ((status || "").toLowerCase()) {
      case "paye":
        return { bg: "#dcfce7", color: "#166534" };
      case "en_attente":
        return { bg: "#fef3c7", color: "#b45309" };
      case "en_retard":
        return { bg: "#fee2e2", color: "#b91c1c" };
      default:
        return { bg: "#e2e8f0", color: "#334155" };
    }
  }

  return (
    <div className="page">
      <div className="pageHeader">
        <h2>Comptabilité</h2>
        <p className="muted">Gestion des factures</p>
      </div>
      <div className="card">
        {loading ? (
          <p className="muted">Chargement...</p>
        ) : (
          <div>
            <div className="filters">
              <select
                value={filters.id_evenement}
                onChange={(e) =>
                  setFilters({ ...filters, id_evenement: e.target.value })
                }
              >
                <option value="">Tous les événements</option>
                {evenements.map((ev) => (
                  <option key={ev.id_evenement} value={ev.id_evenement}>
                    {ev.nom_evenement}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={filters.date_facture}
                onChange={(e) =>
                  setFilters({ ...filters, date_facture: e.target.value })
                }
              />

              <button
                className="btn btnGhost"
                onClick={() =>
                  setFilters({ id_evenement: "", date_facture: "" })
                }
              >
                Reset
              </button>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Événement</th>
                  <th>Total</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredFactures.map((f) => {
                  const style = getStatusColor(f.statut);

                  return (
                    <tr key={f.id_facture}>
                      <td>#{f.id_facture}</td>
                      <td>{f.nom_evenement}</td>

                      <td>
                        <b>
                          {(Number(f.montant_total) + Number(f.taxes)).toFixed(
                            2,
                          )}{" "}
                          $
                        </b>
                      </td>

                      <td>
                        <span
                          style={{
                            background: style.bg,
                            color: style.color,
                            padding: "6px 12px",
                            borderRadius: "999px",
                            fontWeight: 700,
                          }}
                        >
                          {f.statut}
                        </span>
                      </td>

                      <td>
                        {f.date_facture
                          ? new Date(f.date_facture).toLocaleDateString()
                          : "-"}
                      </td>

                      <td style={{ display: "flex", gap: 8 }}>
                        {f.statut !== "paye" && (
                          <button
                            className="btn btnPrimary"
                            onClick={() => payerFacture(f.id_facture)}
                          >
                            Payer
                          </button>
                        )}

                        <button
                          className="btn btnGhost"
                          onClick={() => openInvoice(f)}
                        >
                          Voir facture
                        </button>

                        {f.statut === "paye" && (
                          <button
                            className="btn btnGhost"
                            onClick={() => openReceipt(f)}
                          >
                            Voir reçu
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* MODAL */}

      {/* MODAL */}
      {selectedFacture && (
        <div className="modalOverlay" onClick={() => setSelectedFacture(null)}>
          <div
            className="modalCard invoiceContainer"
            onClick={(e) => e.stopPropagation()}
          >
            {/* CONTENT */}
            <div className="printArea">
              {selectedFacture.type === "receipt" ? (
                <ReceiptUI facture={selectedFacture} />
              ) : (
                <InvoiceUI facture={selectedFacture} />
              )}
            </div>

            {/* ACTIONS */}
            <div className="invoiceBottomActions">
              <button className="btn btnGhost" onClick={downloadPDF}>
                Télécharger PDF
              </button>
              <button
                className="btn btnDanger"
                onClick={() => setSelectedFacture(null)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
