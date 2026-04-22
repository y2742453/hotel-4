// src/pages/Admin/Salles.jsx
import React, { useEffect, useState } from "react";
import { apiFetch } from "../../Api/Client.jsx";
import { useToast } from "../../Components/Toast.jsx";
import "../../styles/table.css";
import "../../styles/forms.css";

export default function SallesPage() {
  const toast = useToast();

  const [salles, setSalles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    nom_salle: "",
    cout: "",
    type: "",
    capacite: "",
    equipements: "",
    statut: "Disponible",
  });
  const [editId, setEditId] = useState(null);

  async function loadSalles() {
    setLoading(true);

    const { res, data } = await apiFetch("/api/salles");

    if (res.ok) setSalles(data || []);
    else toast.error("Impossible de charger les salles");

    setLoading(false);
  }

  useEffect(() => {
    loadSalles();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();

    if (!form.nom_salle || !form.type || !form.cout || !form.capacite) {
      toast.error("Les champs Nom, Type, Cout et Capacité sont requis");
      return;
    }

    if (!form.cout || Number(form.cout) < 0) {
      toast.error("Le coût doit être valide");
      return;
    }

    if (editId) {
      // Mode édition : PUT
      const { res } = await apiFetch(`/api/salles/${editId}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Salle modifiée");
        setEditId(null);
        setForm({
          nom_salle: "",
          cout: "",
          type: "",
          capacite: "",
          equipements: "",
          statut: "Disponible",
        });
        loadSalles();
      } else {
        toast.error("Erreur lors de la modification");
      }
    } else {
      // Création : POST
      const { res } = await apiFetch("/api/salles", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (res.status === 201) {
        toast.success("Salle ajoutée");
        setForm({
          nom_salle: "",
          cout: "",
          type: "",
          capacite: "",
          equipements: "",
          statut: "Disponible",
        });
        loadSalles();
      } else {
        toast.error("Erreur lors de l'ajout");
      }
    }
  }

  async function deleteSalle(id) {
    if (!window.confirm("Supprimer cette salle ?")) return;

    const { res } = await apiFetch(`/api/salles/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      toast.success("Salle supprimée");
      loadSalles();
    } else {
      toast.error("Suppression impossible");
    }
  }

  return (
    <div className="page sallesPage">
      <div className="pageHeader">
        <h2>Gestion des salles</h2>
        <p className="muted">Ajouter et supprimer les salles disponibles.</p>
      </div>

      {/* Formulaire */}
      <form className="card formGrid" onSubmit={handleCreate}>
        <h3>Ajouter une salle</h3>

        <div className="grid2">
          <div className="field">
            <label>Nom salle</label>
            <input
              value={form.nom_salle}
              onChange={(e) => setForm({ ...form, nom_salle: e.target.value })}
            />
          </div>

          <div className="field">
            <label>Coût ($)</label>
            <input
              type="number"
              value={form.cout}
              onChange={(e) => setForm({ ...form, cout: e.target.value })}
            />
          </div>

          <div className="field">
            <label>Type</label>
            <input
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            />
          </div>
        </div>

        <div className="grid2">
          <div className="field">
            <label>Capacité</label>
            <input
              type="number"
              value={form.capacite}
              onChange={(e) => setForm({ ...form, capacite: e.target.value })}
            />
          </div>

          <div className="field">
            <label>Équipements</label>
            <input
              placeholder="Projecteur, Micro..."
              value={form.equipements}
              onChange={(e) =>
                setForm({ ...form, equipements: e.target.value })
              }
            />
          </div>
        </div>

        <div className="grid2">
          <div className="field">
            <label>Statut</label>

            <select
              value={form.statut}
              onChange={(e) => setForm({ ...form, statut: e.target.value })}
            >
              <option value="Disponible">Disponible</option>
              <option value="Réservée">Réservée</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        <div className="field fieldEnd">
          <button className="btn btnPrimary" type="submit">
            {editId ? "Modifier" : "Enregistrer"}
          </button>

          <button
            type="button"
            className="btn"
            onClick={() => {
              setForm({
                nom_salle: "",
                cout: "",
                type: "",
                capacite: "",
                equipements: "",
                statut: "Disponible",
              });
              setEditId(null);
            }}
          >
            Réinitialiser
          </button>
        </div>
      </form>

      {/* Tableau */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Liste des salles</h3>

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
                  <th>Coût</th>
                  <th>Type</th>
                  <th>Capacité</th>
                  <th>Équipements</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {salles.map((s) => (
                  <tr key={s.id_salle}>
                    <td>{s.nom_salle}</td>
                    <td>{s.cout}</td>
                    <td>{s.type}</td>
                    <td>{s.capacite}</td>
                    <td>{s.equipements}</td>
                    <td>{s.statut}</td>

                    <td className="actions">
                      <button
                        className="btn btnSecondary"
                        type="button"
                        onClick={() => {
                          setEditId(s.id_salle);
                          setForm({
                            nom_salle: s.nom_salle,
                            cout: s.cout,
                            type: s.type,
                            capacite: s.capacite,
                            equipements: s.equipements,
                            statut: s.statut,
                          });
                        }}
                      >
                        Modifier
                      </button>
                      <button
                        className="btn btnDanger"
                        type="button"
                        onClick={() => deleteSalle(s.id_salle)}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}

                {salles.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center" }}>
                      Aucune salle
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
