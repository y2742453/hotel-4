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

  // ======================
  // ANNULER
  // ======================
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

  return (
    <div className="page">
      <div
        className="pageHeader"
        style={{ display: "flex", justifyContent: "space-between" }}
      >
        <h2>Liste des événements</h2>

        <button
          className="btn btnPrimary"
          onClick={() => navigate("/organisateur/evenements/creer")}
        >
          + Créer un événement
        </button>
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
            {evenements.map((e) => (
              <tr key={e.id_evenement}>
                <td>{e.nom_evenement}</td>
                <td>{e.type_evenement}</td>
                <td>{e.id_salle}</td>
                <td>{new Date(e.date_debut).toLocaleString()}</td>
                <td>{new Date(e.date_fin).toLocaleString()}</td>

                {/* STATUT COULEUR */}
                <td>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: 6,
                      background:
                        e.statut === "annulé"
                          ? "#ffcccc"
                          : e.statut === "prévu"
                          ? "#ccffcc"
                          : "#eee",
                    }}
                  >
                    {e.statut}
                  </span>
                </td>

                <td style={{ display: "flex", gap: 8 }}>
                  {/* MODIFIER */}
                  <button
                    className="btn btnSecondary"
                    onClick={() =>
                      navigate(
                        `/organisateur/evenements/modifier/${e.id_evenement}`
                      )
                    }
                  >
                    Modifier
                  </button>

                  {/* ANNULER */}
                  <button
                    className="btn"
                    style={{ background: "#999", color: "white" }}
                    disabled={e.statut === "annulé"}
                    onClick={() => handleAnnuler(e.id_evenement)}
                  >
                    Annuler
                  </button>
                </td>
              </tr>
            ))}

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