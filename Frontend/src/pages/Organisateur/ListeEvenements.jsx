import React, { useEffect, useState } from "react";
import { apiFetch } from "../../Api/Client.jsx";
import "../../styles/evenement-table.css";
import { useNavigate, useLocation } from "react-router-dom";

export default function ListeEvenements() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.includes("admin");

  const [evenements, setEvenements] = useState([]);
  const [filter, setFilter] = useState("tous");

  async function loadEvenements() {
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
    if (!window.confirm("Annuler cet événement ?")) return;

    const { res } = await apiFetch(`/api/evenements/${id}/annuler`, {
      method: "PUT",
    });

    if (res.ok) {
      setEvenements((prev) =>
        prev.map((e) =>
          e.id_evenement === id ? { ...e, statut: "annulé" } : e,
        ),
      );
    } else {
      alert("Erreur");
    }
  }

  async function handleConfirm(id) {
    if (!window.confirm("Confirmer cet événement ?")) return;

    const { res } = await apiFetch(`/api/evenements/${id}/confirmer`, {
      method: "PUT",
    });

    if (res.ok) {
      setEvenements((prev) =>
        prev.map((e) =>
          e.id_evenement === id ? { ...e, statut: "confirmé" } : e,
        ),
      );
    } else {
      alert("Erreur confirmation");
    }
  }

  function getStatutStyle(statut) {
    const value = (statut || "").toLowerCase();

    if (value === "confirmé" || value === "confirme")
      return { background: "#dcfce7", color: "#166534" };

    if (value === "annulé" || value === "annule")
      return { background: "#fee2e2", color: "#b91c1c" };

    return { background: "#fef3c7", color: "#92400e" };
  }

  function isConfirme(statut) {
    const value = (statut || "").toLowerCase();
    return value === "confirmé" || value === "confirme";
  }

  return (
    <div className="events-dashboard">
      <div className="events-container">
        {/* HEADER */}
        <div className="events-header">
          <h2>Événements</h2>

          {!isAdmin && (
            <button
              className="btn btnPrimary"
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

        {/* TABS */}
        <div className="events-tabs">
          {["tous", "confirmé", "prévu", "annulé"].map((tab) => (
            <button
              key={tab}
              className={`tab${filter === tab ? " active" : ""}`}
              onClick={() => setFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* TABLE */}
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
              {evenements
                .filter(
                  (e) =>
                    filter === "tous" ||
                    (e.statut || "").toLowerCase() === filter,
                )
                .map((e) => {
                  const confirme = isConfirme(e.statut);
                  const annule =
                    (e.statut || "").toLowerCase() === "annulé" ||
                    (e.statut || "").toLowerCase() === "annule";

                  return (
                    <tr key={e.id_evenement}>
                      <td>{e.nom_evenement}</td>
                      <td>{e.type_evenement}</td>
                      <td>{e.id_salle}</td>
                      <td>{new Date(e.date_debut).toLocaleString()}</td>
                      <td>{new Date(e.date_fin).toLocaleString()}</td>

                      <td>
                        <span
                          style={{
                            ...getStatutStyle(e.statut),
                            padding: "6px 12px",
                            borderRadius: "999px",
                            fontWeight: 700,
                          }}
                        >
                          {e.statut}
                        </span>
                      </td>

                      <td style={{ display: "flex", gap: "8px" }}>
                        <button
                          className="btn btnSecondary"
                          onClick={() => handleEdit(e.id_evenement)}
                        >
                          Modifier
                        </button>

                        {!isAdmin && (
                          <button
                            className="btn btnPrimary"
                            disabled={!confirme}
                            style={{
                              opacity: confirme ? 1 : 0.6,
                              cursor: confirme ? "pointer" : "not-allowed",
                            }}
                            onClick={() =>
                              navigate(
                                `/organisateur/evenements/${e.id_evenement}/services`,
                              )
                            }
                          >
                            Besoins
                          </button>
                        )}

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

                        {isAdmin && !confirme && (
                          <button
                            className="btn btnPrimary"
                            onClick={() => handleConfirm(e.id_evenement)}
                          >
                            Confirmer
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}

              {evenements.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>
                    Aucun événement trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
