import React, { useEffect, useState } from "react";
import { apiFetch } from "../../Api/Client.jsx";
import { useToast } from "../../Components/Toast.jsx";
import "../../styles/table.css";
import "../../styles/forms.css";

export default function ServicesPage() {
  const toast = useToast();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    nom_service: "",
    description: "",
    tarif: "",
  });

  async function loadServices() {
    setLoading(true);

    const { res, data } = await apiFetch("/api/services");

    if (res.ok) setServices(data || []);
    else toast.error("Impossible de charger les services");

    setLoading(false);
  }

  useEffect(() => {
    loadServices();
  }, []);

  function editService(service) {
    setForm({
      nom_service: service.nom_service,
      description: service.description,
      tarif: service.tarif,
    });

    setEditingId(service.id_service);
  }

  async function handleCreate(e) {
    e.preventDefault();

    if (!form.nom_service || !form.tarif) {
      toast.error("Nom et tarif requis");
      return;
    }

    let res;

    if (editingId) {
      ({ res } = await apiFetch(`/api/services/${editingId}`, {
        method: "PUT",
        body: JSON.stringify(form),
      }));

      loadServices();
    } else {
      ({ res } = await apiFetch("/api/services", {
        method: "POST",
        body: JSON.stringify(form),
      }));
    }

    if (res.ok) {
      toast.success(editingId ? "Service modifié" : "Service ajouté");

      setForm({
        nom_service: "",
        description: "",
        tarif: "",
      });

      setEditingId(null);

      loadServices();
    } else {
      toast.error("Erreur");
    }
  }

  async function deleteService(id) {
    if (!window.confirm("Supprimer ce service ?")) return;

    const { res } = await apiFetch(`/api/services/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      toast.success("Service supprimé");
      loadServices();
    } else {
      toast.error("Suppression impossible");
    }
  }

  return (
    <div className="page">
      <div className="pageHeader">
        <h2>Gestion des services</h2>
        <p className="muted">
          Ajouter, modifier et supprimer les services de l'hôtel.
        </p>
      </div>

      <form className="card formGrid" onSubmit={handleCreate}>
        <h3>{editingId ? "Modifier un service" : "Ajouter un service"}</h3>

        <div className="grid2">
          <div className="field">
            <label>Nom service</label>
            <input
              value={form.nom_service}
              onChange={(e) =>
                setForm({ ...form, nom_service: e.target.value })
              }
            />
          </div>

          <div className="field">
            <label>Tarif</label>
            <input
              type="number"
              value={form.tarif}
              onChange={(e) => setForm({ ...form, tarif: e.target.value })}
            />
          </div>
        </div>

        <div className="field">
          <label>Description</label>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="field fieldEnd">
          <button className="btn btnPrimary" type="submit">
            {editingId ? "Modifier" : "Enregistrer"}
          </button>

          <button
            type="button"
            className="btn"
            onClick={() => {
              setForm({
                nom_service: "",
                description: "",
                tarif: "",
              });

              setEditingId(null);
            }}
          >
            Réinitialiser
          </button>
        </div>
      </form>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Liste des services</h3>

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
                  <th>Description</th>
                  <th>Tarif</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {services.map((s) => (
                  <tr key={s.id_service}>
                    <td>{s.nom_service}</td>
                    <td>{s.description}</td>
                    <td>{s.tarif} $</td>

                    <td className="actions">
                      <button className="btn" onClick={() => editService(s)}>
                        Modifier
                      </button>

                      <button
                        className="btn btnDanger"
                        onClick={() => deleteService(s.id_service)}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}

                {services.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center" }}>
                      Aucun service
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
