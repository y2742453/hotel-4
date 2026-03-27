import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../Api/Client.jsx";
import { useToast } from "../../Components/Toast.jsx";
import "../../styles/table.css";
import "../../styles/forms.css";

export default function EvenementsPage() {
  const toast = useToast();
  const navigate = useNavigate();

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

      if (res.ok) setEvenements(data || []);
      else toast.error("Impossible de charger les événements");

      setSalles(sallesData || []);
    } catch {
      toast.error("Erreur chargement");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadEvenements();
  }, []);

  function getSalleName(id) {
    const salle = salles.find((s) => s.id_salle === id);
    return salle ? salle.nom_salle : id;
  }

  function goToServices(id) {
    navigate(`/organisateur/evenements/${id}/services`);
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

  async function deleteEvenement(id) {
    if (!window.confirm("Supprimer cet événement ?")) return;

    const { res } = await apiFetch(`/api/evenements/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      toast.success("Supprimé");
      loadEvenements();
    } else {
      toast.error("Erreur suppression");
    }
  }

  return (
    <div className="page">
      <div className="pageHeader">
        <h2>Gestion des événements</h2>
      </div>

      {/* FORM EDIT */}
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
            <option value="planifié">Planifié</option>
            <option value="confirmé">Confirmé</option>
            <option value="annulé">Annulé</option>
          </select>

          <div>
            <button className="btn btnPrimary">Sauvegarder</button>
            <button
              type="button"
              className="btn"
              onClick={() => setEditId(null)}
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* TABLE */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Liste des événements</h3>

        {loading ? (
          <div className="muted">Chargement...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Type</th>
                <th>Salle</th>
                <th>Date début</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {evenements.map((e) => (
                <tr key={e.id_evenement}>
                  <td>{e.nom_evenement}</td>
                  <td>{e.type_evenement}</td>
                  <td>{getSalleName(e.id_salle)}</td>
                  <td>{new Date(e.date_debut).toLocaleString()}</td>
                  <td>{e.statut}</td>

                  <td style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn btnSecondary"
                      onClick={() => {
                        setEditId(e.id_evenement);
                        setForm({
                          nom_evenement: e.nom_evenement,
                          type_evenement: e.type_evenement,
                          date_debut: e.date_debut,
                          date_fin: e.date_fin,
                          statut: e.statut,
                          id_salle: e.id_salle,
                        });
                      }}
                    >
                      Modifier
                    </button>

                    <button
                      className="btn btnPrimary"
                      onClick={() => goToServices(e.id_evenement)}
                    >
                      Services
                    </button>

                    <button
                      className="btn btnDanger"
                      onClick={() => deleteEvenement(e.id_evenement)}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}

              {evenements.length === 0 && (
                <tr>
                  <td colSpan="6">Aucun événement</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
