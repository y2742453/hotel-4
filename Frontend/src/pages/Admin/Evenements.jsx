// src/pages/Admin/Evenements.jsx
import React, { useEffect, useState } from "react";
import { apiFetch } from "../../Api/Client.jsx";
import { useToast } from "../../Components/Toast.jsx";
import "../../styles/table.css";
import "../../styles/forms.css";

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
    id_salle: ""
  });

  const [editId, setEditId] = useState(null);

  async function loadEvenements() {

    setLoading(true);

    const { res, data } = await apiFetch("/api/evenements");
    const { data: sallesData } = await apiFetch("/api/salles");

    if (res.ok) setEvenements(data || []);
    else toast.error("Impossible de charger les événements");

    setSalles(sallesData || []);

    setLoading(false);
  }

  useEffect(() => {
    loadEvenements();
  }, []);

  async function handleUpdate(e) {

    e.preventDefault();

    if (!form.nom_evenement || !form.type_evenement) {
      toast.error("Nom et type sont requis");
      return;
    }

    const { res } = await apiFetch(`/api/evenements/${editId}`, {
      method: "PUT",
      body: JSON.stringify(form)
    });

    if (res.ok) {

      toast.success("Événement modifié");

      setEditId(null);

      loadEvenements();

    } else {

      toast.error("Erreur lors de la modification");

    }
  }

  async function deleteEvenement(id) {

    if (!window.confirm("Supprimer cet événement ?")) return;

    const { res } = await apiFetch(`/api/evenements/${id}`, {
      method: "DELETE"
    });

    if (res.ok) {

      toast.success("Événement supprimé");

      loadEvenements();

    } else {

      toast.error("Suppression impossible");

    }
  }

  function getSalleName(id) {

    const salle = salles.find((s) => s.id_salle === id);

    return salle ? salle.nom_salle : id;
  }

  return (

    <div className="page">

      <div className="pageHeader">
        <h2>Gestion des événements</h2>
        <p className="muted">Voir, modifier ou supprimer les événements.</p>
      </div>

      {editId && (

        <form className="card formGrid" onSubmit={handleUpdate}>

          <h3>Modifier un événement</h3>

          <div className="field">

            <label>Nom</label>

            <input
              value={form.nom_evenement}
              onChange={(e) =>
                setForm({ ...form, nom_evenement: e.target.value })
              }
            />

          </div>

          <div className="field">

            <label>Type</label>

            <input
              value={form.type_evenement}
              onChange={(e) =>
                setForm({ ...form, type_evenement: e.target.value })
              }
            />

          </div>

          <div className="grid2">

            <div className="field">

              <label>Date début</label>

              <input
                type="datetime-local"
                value={form.date_debut}
                onChange={(e) =>
                  setForm({ ...form, date_debut: e.target.value })
                }
              />

            </div>

            <div className="field">

              <label>Date fin</label>

              <input
                type="datetime-local"
                value={form.date_fin}
                onChange={(e) =>
                  setForm({ ...form, date_fin: e.target.value })
                }
              />

            </div>

          </div>

          <div className="field">

            <label>Salle</label>

            <select
              value={form.id_salle}
              onChange={(e) =>
                setForm({ ...form, id_salle: e.target.value })
              }
            >

              {salles.map((s) => (

                <option key={s.id_salle} value={s.id_salle}>
                  {s.nom_salle}
                </option>

              ))}

            </select>

          </div>

          <div className="field">

            <label>Statut</label>

            <select
              value={form.statut}
              onChange={(e) =>
                setForm({ ...form, statut: e.target.value })
              }
            >

              <option value="Planifié">Planifié</option>
              <option value="Terminé">Terminé</option>
              <option value="Annulé">Annulé</option>

            </select>

          </div>

          <div className="field fieldEnd">

            <button className="btn btnPrimary" type="submit">
              Modifier
            </button>

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

      <div className="card" style={{ marginTop: 16 }}>

        <h3>Liste des événements</h3>

        <div className="tableWrap">

          {loading ? (

            <div className="muted" style={{ padding: 12 }}>
              Chargement...
            </div>

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

                    <td className="actions">

                      <button
                        className="btn btnSecondary"
                        type="button"
                        onClick={() => {

                          setEditId(e.id_evenement);

                          setForm({
                            nom_evenement: e.nom_evenement,
                            type_evenement: e.type_evenement,
                            date_debut: e.date_debut,
                            date_fin: e.date_fin,
                            statut: e.statut,
                            id_salle: e.id_salle
                          });

                        }}
                      >
                        Modifier
                      </button>

                      <button
                        className="btn btnDanger"
                        type="button"
                        onClick={() => deleteEvenement(e.id_evenement)}
                      >
                        Supprimer
                      </button>

                    </td>

                  </tr>

                ))}

                {evenements.length === 0 && (

                  <tr>

                    <td colSpan="6" style={{ textAlign: "center" }}>
                      Aucun événement
                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          )}

        </div>

      </div>

    </div>

  );
}