import React, { useEffect, useState } from "react";
import { apiFetch } from "../../Api/Client.jsx";
import { useToast } from "../../Components/Toast.jsx";
import { useNavigate } from "react-router-dom";
import "../../styles/table.css";
import "../../styles/forms.css";

export default function EvenementsPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [evenements, setEvenements] = useState([]);
  const [salles, setSalles] = useState([]);
  const [loading, setLoading] = useState(true);
  // Fonction pour naviguer vers la page de modification
  const handleEdit = (id) => {
    navigate(`/admin/evenements/modifier/${id}`);
  };

  useEffect(() => {
    async function loadEvenements() {
      setLoading(true);
      try {
        const { res, data } = await apiFetch("/api/evenements");
        const { data: sallesData } = await apiFetch("/api/salles");
        if (res.ok) setEvenements(data || []);
        else toast.error("Impossible de charger les événements");
        setSalles(sallesData || []);
      } catch {
        toast.error("Erreur lors du chargement des données");
      }
      setLoading(false);
    }
    loadEvenements();
  }, [toast]);

  function getSalleName(id) {
    const salle = salles.find((s) => s.id_salle === id);
    return salle ? salle.nom_salle : id;
  }

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
      const { res, data } = await apiFetch("/api/evenements");
      if (res.ok) setEvenements(data || []);
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
      const { res, data } = await apiFetch("/api/evenements");
      if (res.ok) setEvenements(data || []);
    } else {
      toast.error("Suppression impossible");
    }
  }

  return (
    <div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Liste des événements</h3>
        <div className="tableWrap">
          {loading ? (
            <div className="muted" style={{ padding: 12 }}>Chargement...</div>
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
                        onClick={() => handleEdit(e.id_evenement)}
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