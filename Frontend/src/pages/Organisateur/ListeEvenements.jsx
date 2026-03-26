import React, { useEffect, useState } from "react";
import { apiFetch } from "../../Api/Client.jsx";
import { useNavigate } from "react-router-dom";
import "../../styles/table.css";

export default function ListeEvenements() {
  const [evenements, setEvenements] = useState([]);
  const navigate = useNavigate();

  async function loadEvenements() {
    const { res, data } = await apiFetch("/api/evenements");

    if (res.ok) {
      setEvenements(data);
    } else {
      console.error("Erreur chargement événements");
    }
  }

  useEffect(() => {
    loadEvenements();
  }, []);

  async function handleAnnuler(id) {
    const confirm = window.confirm("Annuler cet événement ?");
    if (!confirm) return;

    const { res } = await apiFetch(`/api/evenements/${id}/annuler`, {
      method: "PUT",
    });

    if (res.ok) {
      alert("Événement annulé !");
      loadEvenements();
    } else {
      alert("Erreur");
    }
  }

  function getStatutStyle(statut) {
    const value = (statut || "").toLowerCase();

    if (value === "confirmé" || value === "confirme") {
      return {
        background: "#dcfce7",
        color: "#166534",
      };
    }

    if (value === "brouillon") {
      return {
        background: "#f3f4f6",
        color: "#374151",
      };
    }

    if (value === "annulé" || value === "annule") {
      return {
        background: "#fee2e2",
        color: "#b91c1c",
      };
    }

    return {
      background: "#fef3c7",
      color: "#92400e",
    };
  }

  function isConfirme(statut) {
    const value = (statut || "").toLowerCase();
    return value === "confirmé" || value === "confirme";
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
        <h2>Liste des événements</h2>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            className="btn btnPrimary"
            onClick={() => navigate("/organisateur/demandes-services")}
          >
            Mes demandes de services
          </button>

          <button
            className="btn btnPrimary"
            onClick={() => navigate("/organisateur/evenements/creer")}
          >
            + Créer un événement
          </button>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Type</th>
              <th>Salle</th>
              <th>Date début</th>
              <th>Date fin</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {evenements.map((e) => {
              const evenementConfirme = isConfirme(e.statut);
              const evenementAnnule = (e.statut || "").toLowerCase() === "annulé" ||
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
                        padding: "8px 14px",
                        borderRadius: "999px",
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: "110px",
                      }}
                    >
                      {e.statut}
                    </span>
                  </td>

                  <td>
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      <button
                        className="btn btnSecondary"
                        style={{
                          minWidth: "115px",
                          borderRadius: "12px",
                          fontWeight: 700,
                        }}
                        onClick={() =>
                          navigate(`/organisateur/evenements/modifier/${e.id_evenement}`)
                        }
                      >
                        Modifier
                      </button>

                      <button
                        className="btn btnPrimary"
                        style={{
                          minWidth: "115px",
                          borderRadius: "12px",
                          fontWeight: 700,
                          opacity: evenementConfirme ? 1 : 0.6,
                          cursor: evenementConfirme ? "pointer" : "not-allowed",
                        }}
                        disabled={!evenementConfirme}
                        title={
                          evenementConfirme
                            ? "Saisir les besoins de cet événement"
                            : "Vous ne pouvez ajouter les besoins que pour un événement confirmé"
                        }
                        onClick={() =>
                          navigate(`/organisateur/evenements/${e.id_evenement}/services`)
                        }
                      >
                        Besoins
                      </button>

                      <button
                        className="btn btnDanger"
                        style={{
                          minWidth: "115px",
                          borderRadius: "12px",
                          fontWeight: 700,
                          color: "white",
                          opacity: evenementAnnule ? 0.6 : 1,
                          cursor: evenementAnnule ? "not-allowed" : "pointer",
                        }}
                        disabled={evenementAnnule}
                        onClick={() => handleAnnuler(e.id_evenement)}
                      >
                        Annuler
                      </button>
                    </div>

                    {!evenementConfirme && (
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: "0.88rem",
                          color: "#92400e",
                          fontWeight: 500,
                        }}
                      >
                        Les besoins sont disponibles seulement après confirmation.
                      </div>
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
  );
}