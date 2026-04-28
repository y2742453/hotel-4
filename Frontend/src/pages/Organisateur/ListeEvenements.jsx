import React, { useEffect, useState } from "react";
import { apiFetch } from "../../Api/Client.jsx";
import "../../styles/evenement-table.css";
import "../../styles/table.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "../../Components/Toast.jsx";

export default function ListeEvenements() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const isAdmin = location.pathname.includes("admin");

  const [evenements, setEvenements] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filter, setFilter] = useState("tous");
  const [modalConfirmId, setModalConfirmId] = useState(null);

  async function loadEvenements() {
    // Passer les événements expirés à "Terminé" avant de charger la liste
    await apiFetch("/api/evenements/terminer-expires", { method: "POST" });
    const { res, data } = await apiFetch("/api/evenements");
    if (res.ok) setEvenements(data || []);
  }

  useEffect(() => {
    loadEvenements();
  }, []);

  function handleEdit(id) {
    const base = isAdmin ? "admin" : "organisateur";
    navigate(`/${base}/evenements/modifier/${id}`);
  }

  async function handleCancel(id) {
    const { res, data } = await apiFetch(`/api/evenements/${id}/annuler`, {
      method: "PUT",
    });
    if (res.ok) {
      setEvenements((prev) =>
        prev.map((e) =>
          e.id_evenement === id ? { ...e, statut: "Annulé" } : e,
        ),
      );
      toast.success("Événement annulé");
    } else {
      toast.error(data?.message || "Erreur lors de l'annulation");
    }
  }

  async function handleConfirm(id) {
    const { res, data } = await apiFetch(`/api/evenements/${id}/confirmer`, {
      method: "PUT",
    });
    if (res.ok) {
      setEvenements((prev) =>
        prev.map((e) =>
          e.id_evenement === id ? { ...e, statut: "Confirmé" } : e,
        ),
      );
      toast.success("Événement confirmé");
      return true;
    } else {
      toast.error(data?.message || "Impossible de confirmer cet événement");
      return false;
    }
  }

  async function handleRestore(id) {
    const { res, data } = await apiFetch(`/api/evenements/${id}/restaurer`, {
      method: "PUT",
    });
    if (res.ok) {
      setEvenements((prev) =>
        prev.map((e) =>
          e.id_evenement === id ? { ...e, statut: "Prévu" } : e,
        ),
      );
      toast.success("Événement restauré");
    } else {
      toast.error(data?.message || "Impossible de restaurer");
    }
  }

  function openDetails(event) {
    setSelectedEvent(event);
    setShowDetails(true);
  }

  function closeDetails() {
    setSelectedEvent(null);
    setShowDetails(false);
  }

  function getStatutStyle(statut) {
    const v = (statut || "").toLowerCase();
    if (v === "confirmé" || v === "confirme")
      return { background: "#dcfce7", color: "#166534" };
    if (v === "annulé" || v === "annule")
      return { background: "#fee2e2", color: "#b91c1c" };
    if (v === "terminé" || v === "termine")
      return { background: "#f1f5f9", color: "#475569" };
    return { background: "#fef3c7", color: "#92400e" }; // Prévu / Brouillon
  }

  function isConfirme(statut) {
    const v = (statut || "").toLowerCase();
    return v === "confirmé" || v === "confirme";
  }

  function isAnnule(statut) {
    const v = (statut || "").toLowerCase();
    return v === "annulé" || v === "annule";
  }

  function isTermine(statut) {
    const v = (statut || "").toLowerCase();
    return v === "terminé" || v === "termine";
  }

  /* Format date : 03/05/2026 13h27 */
  function formatDate(dateString) {
    if (!dateString) return "—";

    const cleaned = dateString
      .replace(".000Z", "")
      .replace("Z", "")
      .replace("T", " ");

    const [datePart, timePart = "00:00:00"] = cleaned.split(" ");
    const [year, month, day] = datePart.split("-");

    return `${day}/${month}/${year} ${timePart.slice(0, 5)}`;
  }

  const filtered = evenements.filter(
    (e) => filter === "tous" || (e.statut || "").toLowerCase() === filter,
  );

  return (
    <div className="events-dashboard">
      <div className="events-container">
        {/* ── En-tête ── */}
        <div className="events-header">
          <h2>Événements</h2>
          <div className="events-header-actions">
            {!isAdmin && (
              <button
                className="btn btnGhost"
                onClick={() => navigate("/organisateur/demandes-services")}
              >
                Mes demandes de services
              </button>
            )}
            {!isAdmin && (
              <button
                className="btn-new"
                onClick={() => navigate("/organisateur/evenements/creer")}
              >
                + Nouvel événement
              </button>
            )}
          </div>
        </div>

        {/* ── Onglets ── */}
        <div className="events-tabs">
          {["tous", "confirmé", "prévu", "terminé", "annulé"].map((tab) => (
            <button
              key={tab}
              className={`tab${filter === tab ? " active" : ""}`}
              onClick={() => setFilter(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Tableau ── */}
        <div className="table-wrapper">
          <table className="events-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Type</th>
                <th>Salle</th>
                <th>Début</th>
                <th>Fin</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="events-empty">
                    Aucun événement trouvé
                  </td>
                </tr>
              )}

              {filtered.map((e) => {
                const confirme = isConfirme(e.statut);
                const annule = isAnnule(e.statut);
                const termine = isTermine(e.statut);

                return (
                  <tr
                    key={e.id_evenement}
                    onClick={() => openDetails(e)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <strong>{e.nom_evenement}</strong>
                    </td>
                    <td>{e.type_evenement}</td>
                    <td>{e.id_salle}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {formatDate(e.date_debut)}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {formatDate(e.date_fin)}
                    </td>

                    <td>
                      <span
                        className="statut-badge"
                        style={getStatutStyle(e.statut)}
                      >
                        {e.statut}
                      </span>
                    </td>

                    <td>
                      <div
                        className="actions"
                        onClick={(ev) => ev.stopPropagation()}
                      >
                        {!isAdmin && (
                          <button
                            className="btn btnGhost"
                            onClick={() => handleEdit(e.id_evenement)}
                          >
                            Modifier
                          </button>
                        )}

                        {!isAdmin && !confirme && !termine && !annule && (
                          <button
                            className="btn btnPrimary"
                            disabled={confirme || termine}
                            style={{ opacity: confirme || termine ? 0.45 : 1 }}
                            onClick={() =>
                              navigate(
                                `/organisateur/evenements/${e.id_evenement}/services`,
                              )
                            }
                          >
                            Besoins
                          </button>
                        )}

                        {annule && (
                          <button
                            className="btn btnGhost"
                            onClick={() => handleRestore(e.id_evenement)}
                          >
                            Restaurer
                          </button>
                        )}

                        {!annule && (
                          <button
                            className="btn btnDanger"
                            disabled={annule}
                            style={{
                              opacity: annule ? 0.6 : 1,
                              cursor: annule ? "not-allowed" : "pointer",
                            }}
                            onClick={() => handleCancel(e.id_evenement)}
                          >
                            Annuler
                          </button>
                        )}

                        {isAdmin && !confirme && !annule && !termine && (
                          <button
                            className="btn btnPrimary"
                            onClick={() => setModalConfirmId(e.id_evenement)}
                          >
                            Confirmer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal confirmation ── */}
      {modalConfirmId && (
        <div className="modalOverlay" onClick={() => setModalConfirmId(null)}>
          <div
            className="modalCard"
            onClick={(ev) => ev.stopPropagation()}
            style={{
              background: "#fff",
              padding: "28px",
              borderRadius: "16px",
              minWidth: "320px",
              boxShadow: "0 20px 50px rgba(15,23,42,0.18)",
            }}
          >
            <h3 style={{ marginBottom: "10px" }}>Confirmer l'événement</h3>
            <p style={{ color: "#475569", fontSize: "14px" }}>
              Voulez-vous vraiment confirmer cet événement ?
            </p>
            <div className="actions" style={{ marginTop: "20px" }}>
              <button
                className="btn btnPrimary"
                onClick={async () => {
                  const ok = await handleConfirm(modalConfirmId);
                  if (ok) setModalConfirmId(null);
                }}
              >
                Confirmer
              </button>
              <button
                className="btn btnGhost"
                onClick={() => setModalConfirmId(null)}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal détails ── */}
      {showDetails && selectedEvent && (
        <div className="event-details-overlay" onClick={closeDetails}>
          <div
            className="event-details-modal"
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="event-details-content">
              <div className="event-details-header">
                <div className="event-details-title-section">
                  <h2 className="event-details-title">
                    {selectedEvent.nom_evenement}
                  </h2>
                  <p className="event-details-subtitle">
                    {selectedEvent.type_evenement}
                  </p>
                </div>

                <div className="event-details-status">
                  <span
                    className="statut-badge"
                    style={getStatutStyle(selectedEvent.statut)}
                  >
                    {selectedEvent.statut}
                  </span>
                </div>
              </div>

              <div className="event-details-grid">
                <div className="event-details-card">
                  <span className="event-details-label">Salle</span>
                  <p className="event-details-value">
                    {selectedEvent.id_salle}
                  </p>
                </div>

                <div className="event-details-card">
                  <span className="event-details-label">Participants</span>
                  <p className="event-details-value">
                    {selectedEvent.nb_participants || "—"}
                  </p>
                </div>

                <div className="event-details-card">
                  <span className="event-details-label">Budget</span>
                  <p className="event-details-value">
                    {selectedEvent.budget
                      ? `${Number(selectedEvent.budget).toLocaleString("fr-CA")} $`
                      : "—"}
                  </p>
                </div>

                <div className="event-details-card event-details-schedule-card">
                  <span className="event-details-label">Horaire</span>

                  <div className="event-details-schedule">
                    <div className="event-details-schedule-item">
                      <span className="event-details-schedule-tag">Début</span>
                      <p className="event-details-value">
                        {formatDate(selectedEvent.date_debut)}
                      </p>
                    </div>

                    <div className="event-details-schedule-divider"></div>

                    <div className="event-details-schedule-item">
                      <span className="event-details-schedule-tag">Fin</span>
                      <p className="event-details-value">
                        {formatDate(selectedEvent.date_fin)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="event-details-description-section">
                <h3 className="event-details-description-title">Description</h3>
                <p className="event-details-description-text">
                  {selectedEvent.description ||
                    "Aucune description disponible."}
                </p>
              </div>

              <div className="event-details-actions">
                <button
                  className="btn btnGhost event-details-close-btn"
                  onClick={closeDetails}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
