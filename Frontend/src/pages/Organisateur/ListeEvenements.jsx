import React, { useEffect, useState } from "react";
import { apiFetch } from "../../Api/Client.jsx";
import "../../styles/evenement-table.css";
import { useNavigate, useLocation } from "react-router-dom";

export default function ListeEvenements() {
  const [openMenu, setOpenMenu] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.includes("admin");

  const [evenements, setEvenements] = useState([]);
  const [filter, setFilter] = useState("tous");

  async function loadEvenements() {
    const { res, data } = await apiFetch("/api/evenements");
    if (res.ok) {
      setEvenements(data || []);
    }
  }

  useEffect(() => {
    loadEvenements();
  }, []);

  function toggleMenu(id) {
    setOpenMenu(openMenu === id ? null : id);
  }

  // ✅ CORRIGÉ ICI
  function handleEdit(id) {
    const base = isAdmin ? "admin" : "organisateur";
    navigate(`/${base}/evenements/modifier/${id}`);
  }

  async function handleCancel(id) {
    const confirmCancel = window.confirm("Annuler cet événement ?");
    if (!confirmCancel) return;

    const { res } = await apiFetch(`/api/evenements/${id}/annuler`, {
      method: "PUT",
    });

    if (res.ok) {
      setEvenements((prev) =>
        prev.map((e) =>
          e.id_evenement === id ? { ...e, statut: "annulé" } : e
        )
      );
    } else {
      alert("Erreur");
    }
  }

  async function handleConfirm(id) {
    const confirm = window.confirm("Confirmer cet événement ?");
    if (!confirm) return;

    const { res } = await apiFetch(`/api/evenements/${id}/confirmer`, {
      method: "PUT",
    });

    if (res.ok) {
      setEvenements((prev) =>
        prev.map((e) =>
          e.id_evenement === id ? { ...e, statut: "confirmé" } : e
        )
      );
    } else {
      alert("Erreur lors de la confirmation");
    }
  }

  return (
    <div className="events-dashboard">
      <div className="events-container">
        {/* HEADER */}
        <div className="events-header">
          <h2>Événements</h2>

          {!isAdmin && (
            <button
              className="btn-new"
              onClick={() =>
                navigate("/organisateur/evenements/creer") // ✅ CORRIGÉ
              }
            >
              + Nouvel événement
            </button>
          )}
        </div>

        {/* TABS */}
        <div className="events-tabs">
          <button className={`tab${filter === "tous" ? " active" : ""}`} onClick={() => setFilter("tous")}>Tous</button>
          <button className={`tab${filter === "confirmé" ? " active" : ""}`} onClick={() => setFilter("confirmé")}>Confirmés</button>
          <button className={`tab${filter === "prévu" ? " active" : ""}`} onClick={() => setFilter("prévu")}>Prévus</button>
          <button className={`tab${filter === "annulé" ? " active" : ""}`} onClick={() => setFilter("annulé")}>Annulés</button>
        </div>

        {/* SEARCH */}
        <div className="events-search">
          <input placeholder="Rechercher..." />
        </div>

        {/* TABLE */}
        <div className="table-wrapper">
          <table className="events-table">
            <thead>
              <tr>
                <th></th>
                <th>Nom</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Début</th>
                <th>Fin</th>
                <th>Salle</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {evenements
                .filter((e) => {
                  if (filter === "tous") return true;
                  return (e.statut || "").toLowerCase() === filter;
                })
                .map((ev) => (
                  <tr key={ev.id_evenement}>
                    <td>
                      <input type="checkbox" />
                    </td>

                    <td className="name">{ev.nom_evenement}</td>
                    <td>{ev.type_evenement}</td>

                    <td>
                      <span className={`badge ${ev.statut?.toLowerCase()}`}>
                        {ev.statut}
                      </span>
                    </td>

                    <td>{ev.date_debut}</td>
                    <td>{ev.date_fin}</td>
                    <td>{ev.id_salle}</td>

                    <td className="actions">
                      <div className="menu-container">
                        <button onClick={() => toggleMenu(ev.id_evenement)}>
                          ⋯
                        </button>

                        {openMenu === ev.id_evenement && (
                          <div className="dropdown">
                            <div onClick={() => handleEdit(ev.id_evenement)}>
                              Modifier
                            </div>

                            {isAdmin && ev.statut !== "confirmé" && (
                              <div
                                onClick={() => {
                                  handleConfirm(ev.id_evenement);
                                  setOpenMenu(null);
                                }}
                              >
                                Confirmer
                              </div>
                            )}

                            {ev.statut !== "annulé" && (
                              <div
                                onClick={() => {
                                  handleCancel(ev.id_evenement);
                                  setOpenMenu(null);
                                }}
                              >
                                Annuler
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}