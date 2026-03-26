import React, { useEffect, useState } from "react";
import { apiFetch } from "../../Api/Client.jsx";
import { useToast } from "../../Components/Toast.jsx";
import "../../styles/table.css";
import "../../styles/global.css";

export default function Devis() {
  const toast = useToast();

  const [demandes, setDemandes] = useState([]);
  const [devisList, setDevisList] = useState([]);
  const [loadingDemandes, setLoadingDemandes] = useState(true);
  const [loadingDevis, setLoadingDevis] = useState(true);

  const [selectedDemande, setSelectedDemande] = useState(null);
  const [selectedDevis, setSelectedDevis] = useState(null);

  const [saving, setSaving] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [form, setForm] = useState({
    montant_ht: 0,
    taxes: 0,
    montant_ttc: 0,
  });

  useEffect(() => {
    loadDemandesValidees();
    loadDevis();
  }, []);

  async function loadDemandesValidees() {
    setLoadingDemandes(true);

    const { res, data } = await apiFetch("/api/devis/demandes-validees");

    if (res.ok) {
      setDemandes(Array.isArray(data) ? data : []);
    } else {
      toast.error(data?.message || "Impossible de charger les demandes validées");
    }

    setLoadingDemandes(false);
  }

  async function loadDevis() {
    setLoadingDevis(true);

    const { res, data } = await apiFetch("/api/devis");

    if (res.ok) {
      setDevisList(Array.isArray(data) ? data : []);
    } else {
      toast.error(data?.message || "Impossible de charger les devis");
    }

    setLoadingDevis(false);
  }

  function parseDetails(details) {
    if (details === null || details === undefined || details === "") {
      return null;
    }

    if (typeof details === "object") return details;

    if (typeof details === "string") {
      const text = details.trim();
      if (!text) return null;

      try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === "object") return parsed;
      } catch (error) {
        return text;
      }

      return text;
    }

    return String(details);
  }

  function formatLabel(label) {
    const labels = {
      type_restauration: "Type de restauration",
      nombre_personnes: "Nombre de personnes",
      allergies: "Allergies",
      boissons: "Boissons",
      menu_special: "Menu spécial",
      commentaire: "Commentaire",
      microphones: "Microphones",
      projecteur: "Projecteur",
      ecran_geant: "Écran géant",
      table_mixage: "Table de mixage",
      technicien: "Technicien",
      nombre_agents: "Nombre d'agents",
      controle_acces: "Contrôle d'accès",
      surveillance_parking: "Surveillance parking",
      barrieres_securite: "Barrières de sécurité",
    };

    return labels[label] || label.replaceAll("_", " ");
  }

  function formatValue(value) {
    if (typeof value === "boolean") return value ? "Oui" : "Non";
    if (value === null || value === undefined || value === "") return "-";
    return String(value);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function openDemandeModal(demande) {
    const tarif = Number(demande.tarif || 0);
    const quantite = Number(demande.quantite || 0);
    const montantEstime = Number(demande.montant_estime || 0);

    const montantHT = tarif > 0 ? tarif * quantite : montantEstime;
    const taxes = Number((montantHT * 0.1925).toFixed(2));
    const montantTTC = Number((montantHT + taxes).toFixed(2));

    setSelectedDemande(demande);
    setForm({
      montant_ht: montantHT,
      taxes,
      montant_ttc: montantTTC,
    });
  }

  function updateMontantHT(value) {
    const montantHT = Number(value || 0);
    const taxes = Number((montantHT * 0.1925).toFixed(2));
    const montantTTC = Number((montantHT + taxes).toFixed(2));

    setForm({
      montant_ht: montantHT,
      taxes,
      montant_ttc: montantTTC,
    });
  }

  async function handleCreateDevis(e) {
    e.preventDefault();

    if (!selectedDemande || saving) return;

    setSaving(true);

    const { res, data } = await apiFetch("/api/devis", {
      method: "POST",
      body: JSON.stringify({
        id_evenement: selectedDemande.id_evenement,
        id_service: selectedDemande.id_service,
        montant_ht: Number(form.montant_ht || 0),
        taxes: Number(form.taxes || 0),
        montant_ttc: Number(form.montant_ttc || 0),
      }),
    });

    setSaving(false);

    if (res.ok) {
      toast.success("Devis créé avec succès");
      setSelectedDemande(null);
      await loadDevis();
    } else {
      toast.error(data?.message || "Impossible de créer le devis");
    }
  }

  async function handleVoirDevis(id_devis) {
    setLoadingDetails(true);

    const { res, data } = await apiFetch(`/api/devis/${id_devis}`);

    setLoadingDetails(false);

    if (res.ok) {
      setSelectedDevis(data);
    } else {
      toast.error(data?.message || "Impossible de charger le devis");
    }
  }

  async function handleDeleteDevis(id_devis) {
    const ok = window.confirm("Supprimer ce devis ?");
    if (!ok) return;

    const { res, data } = await apiFetch(`/api/devis/${id_devis}`, {
      method: "DELETE",
    });

    if (res.ok) {
      toast.success("Devis supprimé");
      if (selectedDevis && Number(selectedDevis.id_devis) === Number(id_devis)) {
        setSelectedDevis(null);
      }
      await loadDevis();
    } else {
      toast.error(data?.message || "Erreur suppression");
    }
  }

  function generatePdf() {
    if (!selectedDevis) return;

    const details = parseDetails(selectedDevis.details);

    let detailsHtml = "<p>Aucun détail disponible.</p>";

    if (details) {
      if (typeof details === "string") {
        detailsHtml = `<div class="details-text">${escapeHtml(details).replaceAll("\n", "<br/>")}</div>`;
      } else {
        detailsHtml = `
          <table class="details-table">
            <tbody>
              ${Object.entries(details)
                .map(
                  ([key, value]) => `
                    <tr>
                      <th>${escapeHtml(formatLabel(key))}</th>
                      <td>${escapeHtml(formatValue(value))}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        `;
      }
    }

    const printWindow = window.open("", "_blank", "width=900,height=700");

    if (!printWindow) {
      toast.error("Impossible d'ouvrir la fenêtre d'impression");
      return;
    }

    const html = `
      <html>
        <head>
          <title>Devis ${escapeHtml(selectedDevis.reference)}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 32px;
              color: #0f172a;
              background: #ffffff;
            }

            .page {
              max-width: 900px;
              margin: 0 auto;
            }

            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #1e3a8a;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }

            .brand h1 {
              margin: 0 0 6px 0;
              font-size: 28px;
              color: #1e3a8a;
            }

            .brand p {
              margin: 0;
              color: #475569;
              font-size: 14px;
            }

            .doc-title {
              text-align: right;
            }

            .doc-title h2 {
              margin: 0 0 6px 0;
              font-size: 30px;
              color: #0f172a;
            }

            .doc-title p {
              margin: 0;
              color: #475569;
              font-size: 14px;
            }

            .section {
              margin-top: 24px;
            }

            .section h3 {
              margin: 0 0 12px 0;
              font-size: 20px;
              color: #0f172a;
            }

            .info-table,
            .details-table,
            .totals-table {
              width: 100%;
              border-collapse: collapse;
            }

            .info-table th,
            .info-table td,
            .details-table th,
            .details-table td,
            .totals-table th,
            .totals-table td {
              border: 1px solid #dbe4f0;
              padding: 12px;
              text-align: left;
              vertical-align: top;
            }

            .info-table th,
            .details-table th,
            .totals-table th {
              width: 35%;
              background: #f8fafc;
              font-weight: 700;
            }

            .details-text {
              border: 1px solid #dbe4f0;
              padding: 14px;
              border-radius: 8px;
              line-height: 1.6;
              white-space: normal;
            }

            .totals-table td {
              font-weight: 700;
            }

            .footer {
              margin-top: 32px;
              padding-top: 12px;
              border-top: 1px solid #dbe4f0;
              color: #64748b;
              font-size: 12px;
              text-align: center;
            }

            @media print {
              body {
                padding: 0;
              }

              .page {
                max-width: 100%;
              }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              <div class="brand">
                <h1>Hôtel La Promenade</h1>
                <p>Gestion des événements</p>
              </div>

              <div class="doc-title">
                <h2>DEVIS</h2>
                <p><strong>Référence :</strong> ${escapeHtml(selectedDevis.reference)}</p>
                <p><strong>Date :</strong> ${escapeHtml(
                  selectedDevis.date_creation
                    ? new Date(selectedDevis.date_creation).toLocaleString()
                    : "-"
                )}</p>
              </div>
            </div>

            <div class="section">
              <h3>Informations générales</h3>
              <table class="info-table">
                <tbody>
                  <tr><th>Événement</th><td>${escapeHtml(selectedDevis.nom_evenement)}</td></tr>
                  <tr><th>Service</th><td>${escapeHtml(selectedDevis.nom_service)}</td></tr>
                  <tr><th>Organisateur</th><td>${escapeHtml(
                    `${selectedDevis.prenom_user || ""} ${selectedDevis.nom_user || ""}`.trim()
                  )}</td></tr>
                  <tr><th>Email</th><td>${escapeHtml(selectedDevis.email)}</td></tr>
                  <tr><th>Quantité</th><td>${escapeHtml(selectedDevis.quantite)}</td></tr>
                  <tr><th>Tarif interne</th><td>${escapeHtml(selectedDevis.tarif)}</td></tr>
                  <tr><th>Montant estimé</th><td>${escapeHtml(selectedDevis.montant_estime)}</td></tr>
                  <tr><th>Statut</th><td>${escapeHtml(selectedDevis.statut)}</td></tr>
                </tbody>
              </table>
            </div>

            <div class="section">
              <h3>Détails du besoin</h3>
              ${detailsHtml}
            </div>

            <div class="section">
              <h3>Montants</h3>
              <table class="totals-table">
                <tbody>
                  <tr><th>Montant HT</th><td>${escapeHtml(selectedDevis.montant_ht)}</td></tr>
                  <tr><th>Taxes</th><td>${escapeHtml(selectedDevis.taxes)}</td></tr>
                  <tr><th>Montant TTC</th><td>${escapeHtml(selectedDevis.montant_ttc)}</td></tr>
                </tbody>
              </table>
            </div>

            <div class="footer">
              Document généré depuis la plateforme Hôtel La Promenade
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  }

  return (
    <div className="page" style={{ overflowX: "hidden" }}>
      <div
        className="pageHeader"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2>Devis</h2>
          <p className="muted">
            Préparez et consultez les devis liés aux demandes validées.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btnGhost"
            onClick={loadDemandesValidees}
          >
            Actualiser demandes
          </button>

          <button type="button" className="btn btnGhost" onClick={loadDevis}>
            Actualiser devis
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20, overflow: "hidden" }}>
        <h3>Demandes validées</h3>

        <div style={{ width: "100%", overflowX: "auto" }}>
          {loadingDemandes ? (
            <div className="muted" style={{ padding: 12 }}>
              Chargement...
            </div>
          ) : (
            <table
              className="table"
              style={{
                width: "100%",
                minWidth: "980px",
                tableLayout: "fixed",
              }}
            >
              <thead>
                <tr>
                  <th style={{ width: "18%" }}>Événement</th>
                  <th style={{ width: "14%" }}>Service</th>
                  <th style={{ width: "8%" }}>Quantité</th>
                  <th style={{ width: "10%" }}>Tarif</th>
                  <th style={{ width: "13%" }}>Montant estimé</th>
                  <th style={{ width: "13%" }}>Email</th>
                  <th style={{ width: "12%" }}>Statut</th>
                  <th style={{ width: "12%" }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {demandes.map((d) => (
                  <tr key={`${d.id_evenement}-${d.id_service}`}>
                    <td style={{ wordBreak: "break-word" }}>{d.nom_evenement}</td>
                    <td style={{ wordBreak: "break-word" }}>{d.nom_service}</td>
                    <td>{d.quantite}</td>
                    <td>{d.tarif}</td>
                    <td>{d.montant_estime}</td>
                    <td style={{ wordBreak: "break-word" }}>{d.email}</td>
                    <td>
                      <span
                        style={{
                          background: "#dcfce7",
                          color: "#166534",
                          border: "1px solid #bbf7d0",
                          padding: "8px 14px",
                          borderRadius: "999px",
                          fontWeight: 800,
                          display: "inline-flex",
                          minWidth: "110px",
                          justifyContent: "center",
                        }}
                      >
                        Validée
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btnPrimary"
                        onClick={() => openDemandeModal(d)}
                        style={{ minWidth: "120px", borderRadius: "12px" }}
                      >
                        Préparer
                      </button>
                    </td>
                  </tr>
                ))}

                {demandes.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center" }}>
                      Aucune demande validée disponible
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <h3>Devis créés</h3>

        <div style={{ width: "100%", overflowX: "auto" }}>
          {loadingDevis ? (
            <div className="muted" style={{ padding: 12 }}>
              Chargement...
            </div>
          ) : (
            <table
              className="table"
              style={{
                width: "100%",
                minWidth: "1040px",
                tableLayout: "fixed",
              }}
            >
              <thead>
                <tr>
                  <th style={{ width: "10%" }}>Référence</th>
                  <th style={{ width: "18%" }}>Événement</th>
                  <th style={{ width: "12%" }}>Service</th>
                  <th style={{ width: "11%" }}>Montant HT</th>
                  <th style={{ width: "10%" }}>Taxes</th>
                  <th style={{ width: "12%" }}>Montant TTC</th>
                  <th style={{ width: "9%" }}>Statut</th>
                  <th style={{ width: "12%" }}>Date création</th>
                  <th style={{ width: "16%" }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {devisList.map((d) => (
                  <tr key={d.id_devis}>
                    <td style={{ wordBreak: "break-word" }}>{d.reference}</td>
                    <td style={{ wordBreak: "break-word" }}>{d.nom_evenement}</td>
                    <td style={{ wordBreak: "break-word" }}>{d.nom_service}</td>
                    <td>{d.montant_ht}</td>
                    <td>{d.taxes}</td>
                    <td>{d.montant_ttc}</td>
                    <td>{d.statut}</td>
                    <td>
                      {d.date_creation
                        ? new Date(d.date_creation).toLocaleString()
                        : "-"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="btn btnGhost"
                          onClick={() => handleVoirDevis(d.id_devis)}
                          style={{ minWidth: "90px", borderRadius: "12px" }}
                        >
                          Voir
                        </button>

                        <button
                          type="button"
                          className="btn btnDanger"
                          onClick={() => handleDeleteDevis(d.id_devis)}
                          style={{
                            minWidth: "100px",
                            borderRadius: "12px",
                            color: "white",
                          }}
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {devisList.length === 0 && (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center" }}>
                      Aucun devis créé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedDemande && (
        <div className="modalOverlay" onClick={() => setSelectedDemande(null)}>
          <div className="modalCard card" onClick={(e) => e.stopPropagation()}>
            <div
              className="pageHeader"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>Préparer le devis</h3>
                <p className="muted" style={{ marginTop: 8 }}>
                  {selectedDemande.nom_evenement} — {selectedDemande.nom_service}
                </p>
              </div>

              <button
                type="button"
                className="btn btnGhost"
                onClick={() => setSelectedDemande(null)}
              >
                Fermer
              </button>
            </div>

            <div className="card" style={{ marginTop: 16 }}>
              <h3>Informations de la demande</h3>

              <table className="table">
                <tbody>
                  <tr>
                    <th>Événement</th>
                    <td>{selectedDemande.nom_evenement}</td>
                  </tr>
                  <tr>
                    <th>Service</th>
                    <td>{selectedDemande.nom_service}</td>
                  </tr>
                  <tr>
                    <th>Quantité</th>
                    <td>{selectedDemande.quantite}</td>
                  </tr>
                  <tr>
                    <th>Tarif interne</th>
                    <td>{selectedDemande.tarif}</td>
                  </tr>
                  <tr>
                    <th>Montant estimé</th>
                    <td>{selectedDemande.montant_estime}</td>
                  </tr>
                  <tr>
                    <th>Organisateur</th>
                    <td>
                      {selectedDemande.prenom} {selectedDemande.nom}
                    </td>
                  </tr>
                  <tr>
                    <th>Email</th>
                    <td>{selectedDemande.email}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="card" style={{ marginTop: 16 }}>
              <h3>Détails du besoin</h3>

              {(() => {
                const details = parseDetails(selectedDemande.details);

                if (!details) {
                  return <p className="muted">Aucun détail disponible.</p>;
                }

                if (typeof details === "string") {
                  return (
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                      {details}
                    </div>
                  );
                }

                return (
                  <table className="table">
                    <tbody>
                      {Object.entries(details).map(([key, value]) => (
                        <tr key={key}>
                          <th>{formatLabel(key)}</th>
                          <td>{formatValue(value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>

            <form onSubmit={handleCreateDevis}>
              <div
                className="card"
                style={{
                  marginTop: 16,
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 12,
                }}
              >
                <div>
                  <label>Montant HT</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.montant_ht}
                    onChange={(e) => updateMontantHT(e.target.value)}
                  />
                </div>

                <div>
                  <label>Taxes</label>
                  <input type="number" value={form.taxes} readOnly />
                </div>

                <div>
                  <label>Montant TTC</label>
                  <input type="number" value={form.montant_ttc} readOnly />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                <button type="submit" className="btn btnPrimary" disabled={saving}>
                  {saving ? "Création..." : "Créer le devis"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedDevis && (
        <div className="modalOverlay" onClick={() => setSelectedDevis(null)}>
          <div className="modalCard card" onClick={(e) => e.stopPropagation()}>
            <div
              className="pageHeader"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>Détail du devis</h3>
                <p className="muted" style={{ marginTop: 8 }}>
                  Référence : {selectedDevis.reference}
                </p>
              </div>

              <button
                type="button"
                className="btn btnGhost"
                onClick={() => setSelectedDevis(null)}
              >
                Fermer
              </button>
            </div>

            {loadingDetails ? (
              <div className="muted" style={{ padding: 12 }}>
                Chargement...
              </div>
            ) : (
              <>
                <div className="card" style={{ marginTop: 16 }}>
                  <h3>Informations générales</h3>

                  <table className="table">
                    <tbody>
                      <tr>
                        <th>Référence</th>
                        <td>{selectedDevis.reference}</td>
                      </tr>
                      <tr>
                        <th>Événement</th>
                        <td>{selectedDevis.nom_evenement}</td>
                      </tr>
                      <tr>
                        <th>Service</th>
                        <td>{selectedDevis.nom_service}</td>
                      </tr>
                      <tr>
                        <th>Organisateur</th>
                        <td>
                          {selectedDevis.prenom_user} {selectedDevis.nom_user}
                        </td>
                      </tr>
                      <tr>
                        <th>Email</th>
                        <td>{selectedDevis.email}</td>
                      </tr>
                      <tr>
                        <th>Quantité</th>
                        <td>{selectedDevis.quantite}</td>
                      </tr>
                      <tr>
                        <th>Tarif interne</th>
                        <td>{selectedDevis.tarif}</td>
                      </tr>
                      <tr>
                        <th>Montant estimé</th>
                        <td>{selectedDevis.montant_estime}</td>
                      </tr>
                      <tr>
                        <th>Montant HT</th>
                        <td>{selectedDevis.montant_ht}</td>
                      </tr>
                      <tr>
                        <th>Taxes</th>
                        <td>{selectedDevis.taxes}</td>
                      </tr>
                      <tr>
                        <th>Montant TTC</th>
                        <td>{selectedDevis.montant_ttc}</td>
                      </tr>
                      <tr>
                        <th>Statut</th>
                        <td>{selectedDevis.statut}</td>
                      </tr>
                      <tr>
                        <th>Date création</th>
                        <td>
                          {selectedDevis.date_creation
                            ? new Date(selectedDevis.date_creation).toLocaleString()
                            : "-"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="card" style={{ marginTop: 16 }}>
                  <h3>Détails du besoin</h3>

                  {(() => {
                    const details = parseDetails(selectedDevis.details);

                    if (!details) {
                      return <p className="muted">Aucun détail disponible.</p>;
                    }

                    if (typeof details === "string") {
                      return (
                        <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                          {details}
                        </div>
                      );
                    }

                    return (
                      <table className="table">
                        <tbody>
                          {Object.entries(details).map(([key, value]) => (
                            <tr key={key}>
                              <th>{formatLabel(key)}</th>
                              <td>{formatValue(value)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                  <button
                    type="button"
                    className="btn btnPrimary"
                    onClick={generatePdf}
                  >
                    Générer PDF
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}