import React, { useEffect, useState } from "react";
import { apiFetch } from "../../Api/Client.jsx";
import { useToast } from "../../Components/Toast.jsx";
import "../../styles/table.css";
import "../../styles/forms.css";
import "../../styles/global.css";

export default function EvenementsPage() {
  const toast = useToast();

  const [evenements, setEvenements] = useState([]);
  const [salles, setSalles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    nom_evenement: "",
    type_evenement: "",
    date_debut: "",
    date_fin: "",
    statut: "",
    id_salle: "",
  });

  const [editId, setEditId] = useState(null);

  async function loadEvenements() {
    setLoading(true);
    try {
      const { res, data } = await apiFetch("/api/evenements");
      const { data: sallesData } = await apiFetch("/api/salles");

      if (res.ok) {
        setEvenements(Array.isArray(data) ? data : []);
      } else {
        toast.error("Impossible de charger les événements");
      }

      setSalles(Array.isArray(sallesData) ? sallesData : []);
    } catch {
      toast.error("Erreur chargement");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadEvenements();
  }, []);

  function getSalleName(id) {
    const salle = salles.find((s) => Number(s.id_salle) === Number(id));
    return salle ? salle.nom_salle : id;
  }

  function getStatutStyle(statut) {
    const value = (statut || "").toLowerCase();

    if (value === "confirmé" || value === "confirme") {
      return {
        background: "#dcfce7",
        color: "#166534",
        border: "1px solid #bbf7d0",
      };
    }

    if (value === "annulé" || value === "annule") {
      return {
        background: "#fee2e2",
        color: "#b91c1c",
        border: "1px solid #fecaca",
      };
    }

    return {
      background: "#fef3c7",
      color: "#92400e",
      border: "1px solid #fde68a",
    };
  }

  async function handleUpdate(e) {
    e.preventDefault();

    if (!form.nom_evenement || !form.type_evenement) {
      toast.error("Nom et type requis");
      return;
    }

    const { res } = await apiFetch(`/api/evenements/${editId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      toast.success("Événement modifié");
      setEditId(null);
      loadEvenements();
    } else {
      toast.error("Erreur modification");
    }
  }

  async function handleConfirm(id) {
    const ok = window.confirm("Confirmer cet événement ?");
    if (!ok) return;

    const { res, data } = await apiFetch(`/api/evenements/${id}/confirmer`, {
      method: "PUT",
    });

    if (res.ok) {
      toast.success("Événement confirmé");
      loadEvenements();
    } else {
      toast.error(data?.message || "Erreur confirmation");
    }
  }

  async function handleAnnuler(id) {
    const ok = window.confirm("Annuler cet événement ?");
    if (!ok) return;

    const { res, data } = await apiFetch(`/api/evenements/${id}/annuler`, {
      method: "PUT",
    });

    if (res.ok) {
      toast.success("Événement annulé");
      loadEvenements();
    } else {
      toast.error(data?.message || "Erreur annulation");
    }
  }

  async function deleteEvenement(id) {
    const ok = window.confirm("Supprimer cet événement ?");
    if (!ok) return;

    const { res } = await apiFetch(`/api/evenements/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      toast.success("Événement supprimé");
      loadEvenements();
    } else {
      toast.error("Erreur suppression");
    }
  }

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <h2>Gestion des événements</h2>
          <p className="muted">
            L’administrateur peut consulter, modifier, confirmer ou annuler les événements.
          </p>
        </div>
      </div>

      {editId && (
        <form className="card formGrid" onSubmit={handleUpdate}>
          <h3>Modifier un événement</h3>

          <input
            placeholder="Nom"
            value={form.nom_evenement}
            onChange={(e) =>
              setForm({ ...form, nom_evenement: e.target.value })
            }
          />

          <input
            placeholder="Type"
            value={form.type_evenement}
            onChange={(e) =>
              setForm({ ...form, type_evenement: e.target.value })
            }
          />

          <input
            type="datetime-local"
            value={form.date_debut}
            onChange={(e) => setForm({ ...form, date_debut: e.target.value })}
          />

          <input
            type="datetime-local"
            value={form.date_fin}
            onChange={(e) => setForm({ ...form, date_fin: e.target.value })}
          />

          <select
            value={form.id_salle}
            onChange={(e) => setForm({ ...form, id_salle: e.target.value })}
          >
            <option value="">Choisir une salle</option>
            {salles.map((s) => (
              <option key={s.id_salle} value={s.id_salle}>
                {s.nom_salle}
              </option>
            ))}
          </select>

          <select
            value={form.statut}
            onChange={(e) => setForm({ ...form, statut: e.target.value })}
          >
            <option value="prévu">Prévu</option>
            <option value="confirmé">Confirmé</option>
            <option value="annulé">Annulé</option>
          </select>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn btnPrimary" type="submit">
              Sauvegarder
            </button>
            <button
              type="button"
              className="btn btnGhost"
              onClick={() => setEditId(null)}
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Liste des événements</h3>

        {loading ? (
          <div className="muted">Chargement...</div>
        ) : (
          <div style={{ width: "100%", overflowX: "auto" }}>
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
                  const statut = (e.statut || "").toLowerCase();
                  const isConfirmed =
                    statut === "confirmé" || statut === "confirme";
                  const isCancelled =
                    statut === "annulé" || statut === "annule";

                  return (
                    <tr key={e.id_evenement}>
                      <td>{e.nom_evenement}</td>
                      <td>{e.type_evenement}</td>
                      <td>{getSalleName(e.id_salle)}</td>
                      <td>
                        {e.date_debut
                          ? new Date(e.date_debut).toLocaleString()
                          : "-"}
                      </td>
                      <td>
                        {e.date_fin
                          ? new Date(e.date_fin).toLocaleString()
                          : "-"}
                      </td>
                      <td>
                        <span
                          style={{
                            ...getStatutStyle(e.statut),
                            padding: "8px 14px",
                            borderRadius: "999px",
                            fontWeight: 700,
                            display: "inline-flex",
                            justifyContent: "center",
                            minWidth: "110px",
                          }}
                        >
                          {e.statut}
                        </span>
                      </td>

                      <td>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            className="btn btnSecondary"
                            onClick={() => {
                              setEditId(e.id_evenement);
                              setForm({
                                nom_evenement: e.nom_evenement || "",
                                type_evenement: e.type_evenement || "",
                                date_debut: e.date_debut || "",
                                date_fin: e.date_fin || "",
                                statut: e.statut || "",
                                id_salle: e.id_salle || "",
                              });
                            }}
                          >
                            Modifier
                          </button>

                          <button
                            className="btn btnPrimary"
                            onClick={() => handleConfirm(e.id_evenement)}
                            disabled={isConfirmed || isCancelled}
                            style={{
                              opacity: isConfirmed || isCancelled ? 0.6 : 1,
                              cursor:
                                isConfirmed || isCancelled
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                          >
                            Confirmer
                          </button>

                          <button
                            className="btn btnDanger"
                            onClick={() => handleAnnuler(e.id_evenement)}
                            disabled={isCancelled}
                            style={{
                              color: "white",
                              opacity: isCancelled ? 0.6 : 1,
                              cursor: isCancelled ? "not-allowed" : "pointer",
                            }}
                          >
                            Annuler
                          </button>

                          <button
                            className="btn btnGhost"
                            onClick={() => deleteEvenement(e.id_evenement)}
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {evenements.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center" }}>
                      Aucun événement
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}