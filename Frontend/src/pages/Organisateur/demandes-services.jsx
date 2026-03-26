import React, { useEffect, useState } from "react";
import { apiFetch } from "../../Api/Client.jsx";
import { useToast } from "../../Components/Toast.jsx";
import "../../styles/global.css";
import "../../styles/table.css";

export default function MesDemandesServices() {
  const toast = useToast();

  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDetails, setSelectedDetails] = useState(null);

  async function loadDemandes() {
    setLoading(true);

    const { res, data } = await apiFetch("/api/evenementservices");

    if (res.ok) {
      setDemandes(Array.isArray(data) ? data : []);
    } else {
      toast.error(data?.message || "Impossible de charger les demandes de services");
    }

    setLoading(false);
  }

  useEffect(() => {
    loadDemandes();
  }, []);

  function renderStatut(statut) {
    if (statut === "Valide") {
      return (
        <span
          className="btn btnPrimary"
          style={{
            whiteSpace: "nowrap",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          Validé
        </span>
      );
    }

    if (statut === "Refuse") {
      return (
        <span
          className="btn btnDanger"
          style={{
            whiteSpace: "nowrap",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          Refusé
        </span>
      );
    }

    return (
      <span
        className="btn btnWarn"
        style={{
          whiteSpace: "nowrap",
          display: "inline-flex",
          alignItems: "center",
        }}
      >
        En attente
      </span>
    );
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

  function parseDetails(details) {
    if (details === null || details === undefined || details === "") {
      return null;
    }

    if (typeof details === "object") {
      return details;
    }

    if (typeof details === "string") {
      const text = details.trim();

      if (!text) return null;

      try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      } catch (error) {
        // ce n'est pas du JSON, on garde le texte brut
      }

      return text;
    }

    return String(details);
  }

  function getDetailsSummary(demande) {
    const parsedDetails = parseDetails(demande.details);

    if (!parsedDetails) {
      return "Aucun détail";
    }

    if (typeof parsedDetails === "string") {
      return parsedDetails.length > 80
        ? `${parsedDetails.slice(0, 80)}...`
        : parsedDetails;
    }

    const nomService = (demande.nom_service || "").toLowerCase();

    if (nomService.includes("traiteur") || nomService.includes("restauration")) {
      const type = parsedDetails.type_restauration || "Restauration";
      const nb = parsedDetails.nombre_personnes || 0;
      return `${type} • ${nb} pers.`;
    }

    if (nomService.includes("audio") || nomService.includes("audiovisuel")) {
      const micros = parsedDetails.microphones || 0;
      const projecteur = parsedDetails.projecteur ? "projecteur" : "sans projecteur";
      return `${micros} micros • ${projecteur}`;
    }

    if (nomService.includes("sécurité") || nomService.includes("securite")) {
      const agents = parsedDetails.nombre_agents || 0;
      const acces = parsedDetails.controle_acces
        ? "contrôle accès"
        : "sans contrôle accès";
      return `${agents} agents • ${acces}`;
    }

    const firstEntries = Object.entries(parsedDetails).slice(0, 2);

    if (firstEntries.length === 0) return "Voir détails";

    return firstEntries
      .map(([key, value]) => `${formatLabel(key)}: ${formatValue(value)}`)
      .join(" • ");
  }

  return (
    <div className="page">
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
          <h2>Mes demandes de services</h2>
          <p className="muted">
            Consultez toutes les demandes de services liées à vos événements.
          </p>
        </div>

        <button type="button" className="btn btnGhost" onClick={loadDemandes}>
          Actualiser
        </button>
      </div>

      <div className="card">
        <h3>Liste des demandes</h3>

        <div className="tableWrap">
          {loading ? (
            <div className="muted" style={{ padding: 12 }}>
              Chargement...
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Événement</th>
                  <th>Service</th>
                  <th>Quantité</th>
                  <th>Montant estimé</th>
                  <th>Statut</th>
                  <th>Date demande</th>
                  <th>Détails</th>
                </tr>
              </thead>

              <tbody>
                {demandes.map((d) => (
                  <tr key={`${d.id_evenement}-${d.id_service}`}>
                    <td>{d.nom_evenement || `Événement #${d.id_evenement}`}</td>
                    <td>{d.nom_service}</td>
                    <td>{d.quantite}</td>
                    <td>{d.montant_estime}</td>

                    <td style={{ whiteSpace: "nowrap" }}>{renderStatut(d.statut)}</td>

                    <td style={{ whiteSpace: "nowrap" }}>
                      {d.date_demande
                        ? new Date(d.date_demande).toLocaleString()
                        : "-"}
                    </td>

                    <td style={{ minWidth: 260 }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                          alignItems: "flex-start",
                        }}
                      >
                        <span
                          className="muted"
                          style={{
                            lineHeight: 1.4,
                            wordBreak: "break-word",
                          }}
                        >
                          {getDetailsSummary(d)}
                        </span>

                        <button
                          type="button"
                          className="btn btnGhost"
                          onClick={() => setSelectedDetails(d)}
                        >
                          Voir détails
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {demandes.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center" }}>
                      Aucune demande de service trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedDetails && (
        <div className="modalOverlay" onClick={() => setSelectedDetails(null)}>
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
                  {selectedDetails.nom_evenement ||
                    `Événement #${selectedDetails.id_evenement}`}{" "}
                  — {selectedDetails.nom_service}
                </p>
              </div>

              <button
                type="button"
                className="btn btnGhost"
                onClick={() => setSelectedDetails(null)}
              >
                Fermer
              </button>
            </div>

            <div className="tableWrap" style={{ marginTop: 12 }}>
              <table className="table">
                <tbody>
                  <tr>
                    <th>Événement</th>
                    <td>
                      {selectedDetails.nom_evenement ||
                        `Événement #${selectedDetails.id_evenement}`}
                    </td>
                  </tr>
                  <tr>
                    <th>Service</th>
                    <td>{selectedDetails.nom_service}</td>
                  </tr>
                  <tr>
                    <th>Quantité</th>
                    <td>{selectedDetails.quantite}</td>
                  </tr>
                  <tr>
                    <th>Montant estimé</th>
                    <td>{selectedDetails.montant_estime}</td>
                  </tr>
                  <tr>
                    <th>Statut</th>
                    <td>{renderStatut(selectedDetails.statut)}</td>
                  </tr>
                  <tr>
                    <th>Date demande</th>
                    <td>
                      {selectedDetails.date_demande
                        ? new Date(selectedDetails.date_demande).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="card" style={{ marginTop: 16 }}>
              <h3>Détails complets</h3>

              {(() => {
                const parsedDetails = parseDetails(selectedDetails.details);

                if (!parsedDetails) {
                  return <p className="muted">Aucun détail disponible.</p>;
                }

                if (typeof parsedDetails === "string") {
                  return (
                    <div
                      style={{
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.6,
                        wordBreak: "break-word",
                      }}
                    >
                      {parsedDetails}
                    </div>
                  );
                }

                return (
                  <table className="table">
                    <tbody>
                      {Object.entries(parsedDetails).map(([key, value]) => (
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
          </div>
        </div>
      )}
    </div>
  );
}