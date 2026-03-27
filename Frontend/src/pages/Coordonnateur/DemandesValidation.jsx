// src/pages/Coordinateur/DemandesValidation.jsx
import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../Api/Client.jsx";
import { useToast } from "../../Components/Toast.jsx";
import "../../styles/table.css";
import "../../styles/global.css";

export default function DemandesValidation() {
  const toast = useToast();

  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filtre, setFiltre] = useState("tous");

  useEffect(() => {
    loadDemandes();
  }, []);

  async function loadDemandes() {
    setLoading(true);

    const { res, data } = await apiFetch("/api/evenementservices");

    if (res.ok) {
      setDemandes(Array.isArray(data) ? data : []);
    } else {
      toast.error(data?.message || "Impossible de charger les demandes");
    }

    setLoading(false);
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

  function getStatutBadge(statut) {
    const value = (statut || "").toLowerCase();

    if (value === "valide") {
      return {
        text: "Validée",
        style: {
          background: "#dcfce7",
          color: "#166534",
          border: "1px solid #bbf7d0",
        },
      };
    }

    if (value === "refuse") {
      return {
        text: "Refusée",
        style: {
          background: "#fee2e2",
          color: "#b91c1c",
          border: "1px solid #fecaca",
        },
      };
    }

    return {
      text: "En attente",
      style: {
        background: "#fef3c7",
        color: "#92400e",
        border: "1px solid #fde68a",
      },
    };
  }

  async function changerStatut(demande, statut) {
    if (saving) return;

    setSaving(true);

    const { res, data } = await apiFetch(
      `/api/evenementservices/${demande.id_evenement}/${demande.id_service}/statut`,
      {
        method: "PUT",
        body: JSON.stringify({ statut }),
      }
    );

    setSaving(false);

    if (res.ok) {
      toast.success(
        statut === "Valide"
          ? "Demande validée avec succès"
          : "Demande refusée avec succès"
      );

      const updatedSelected = { ...demande, statut };
      setSelected(updatedSelected);
      await loadDemandes();
    } else {
      toast.error(data?.message || "Impossible de mettre à jour le statut");
    }
  }

  const demandesFiltrees = useMemo(() => {
    if (filtre === "tous") return demandes;

    return demandes.filter((d) => {
      const s = (d.statut || "").toLowerCase();
      if (filtre === "demande") return s === "demande";
      if (filtre === "valide") return s === "valide";
      if (filtre === "refuse") return s === "refuse";
      return true;
    });
  }, [demandes, filtre]);

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
          <h2>Validation des demandes</h2>
          <p className="muted">
            Consultez les demandes et traitez-les depuis la fiche de détail.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <select
            value={filtre}
            onChange={(e) => setFiltre(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: "10px",
              border: "1px solid #d7e1ef",
              minWidth: "200px",
              background: "#fff",
            }}
          >
            <option value="tous">Tous les statuts</option>
            <option value="demande">En attente</option>
            <option value="valide">Validées</option>
            <option value="refuse">Refusées</option>
          </select>

          <button type="button" className="btn btnGhost" onClick={loadDemandes}>
            Actualiser
          </button>
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ width: "100%", overflowX: "auto" }}>
          {loading ? (
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
                  <th style={{ width: "13%" }}>Montant estimé</th>
                  <th style={{ width: "14%" }}>Statut</th>
                  <th style={{ width: "21%" }}>Date demande</th>
                  <th style={{ width: "12%" }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {demandesFiltrees.map((d) => {
                  const badge = getStatutBadge(d.statut);

                  return (
                    <tr key={`${d.id_evenement}-${d.id_service}`}>
                      <td style={{ wordBreak: "break-word" }}>
                        {d.nom_evenement || `Événement #${d.id_evenement}`}
                      </td>

                      <td style={{ wordBreak: "break-word" }}>{d.nom_service}</td>

                      <td>{d.quantite}</td>

                      <td>{d.montant_estime}</td>

                      <td>
                        <span
                          style={{
                            ...badge.style,
                            padding: "8px 14px",
                            borderRadius: "999px",
                            fontWeight: 800,
                            fontSize: "0.9rem",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: "120px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {badge.text}
                        </span>
                      </td>

                      <td style={{ whiteSpace: "nowrap" }}>
                        {d.date_demande
                          ? new Date(d.date_demande).toLocaleString()
                          : "-"}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="btn btnGhost"
                          onClick={() => setSelected(d)}
                          style={{
                            minWidth: "100px",
                            borderRadius: "12px",
                          }}
                        >
                          Ouvrir
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {demandesFiltrees.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center" }}>
                      Aucune demande trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selected && (
        <div className="modalOverlay" onClick={() => setSelected(null)}>
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
                <h3 style={{ margin: 0 }}>Détails de la demande</h3>
                <p className="muted" style={{ marginTop: 8 }}>
                  {selected.nom_evenement || `Événement #${selected.id_evenement}`} —{" "}
                  {selected.nom_service}
                </p>
              </div>

              <button
                type="button"
                className="btn btnGhost"
                onClick={() => setSelected(null)}
              >
                Fermer
              </button>
            </div>

            <div className="card" style={{ marginTop: 16 }}>
              <h3>Informations générales</h3>

              <table className="table">
                <tbody>
                  <tr>
                    <th>Événement</th>
                    <td>
                      {selected.nom_evenement || `Événement #${selected.id_evenement}`}
                    </td>
                  </tr>
                  <tr>
                    <th>Service</th>
                    <td>{selected.nom_service}</td>
                  </tr>
                  <tr>
                    <th>Quantité</th>
                    <td>{selected.quantite}</td>
                  </tr>
                  <tr>
                    <th>Montant estimé</th>
                    <td>{selected.montant_estime}</td>
                  </tr>
                  <tr>
                    <th>Statut</th>
                    <td>{getStatutBadge(selected.statut).text}</td>
                  </tr>
                  <tr>
                    <th>Date demande</th>
                    <td>
                      {selected.date_demande
                        ? new Date(selected.date_demande).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="card" style={{ marginTop: 16 }}>
              <h3>Détails du besoin</h3>

              {(() => {
                const details = parseDetails(selected.details);

                if (!details) {
                  return <p className="muted">Aucun détail disponible.</p>;
                }

                if (typeof details === "string") {
                  return (
                    <div
                      style={{
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.6,
                        wordBreak: "break-word",
                      }}
                    >
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

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginTop: 16,
              }}
            >
              <button
                type="button"
                className="btn btnPrimary"
                onClick={() => changerStatut(selected, "Valide")}
                disabled={
                  saving ||
                  ["valide", "refuse"].includes((selected.statut || "").toLowerCase())
                }
              >
                Valider la demande
              </button>

              <button
                type="button"
                className="btn btnDanger"
                onClick={() => changerStatut(selected, "Refuse")}
                disabled={
                  saving ||
                  ["valide", "refuse"].includes((selected.statut || "").toLowerCase())
                }
                style={{ color: "white" }}
              >
                Refuser la demande
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}