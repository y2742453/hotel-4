// src/pages/Organisateur/CreerEvenement.jsx
import React, { useEffect, useState } from "react";
import { apiFetch } from "../../Api/Client.jsx";
import { useToast } from "../../Components/Toast.jsx";
import "../../styles/forms.css";
import "../../styles/table.css";

export default function CreerEvenement() {
  const toast = useToast();

  const [salles, setSalles] = useState([]);
  const [services, setServices] = useState([]);

  const [form, setForm] = useState({
    titre: "",
    id_salle: "",
    date_debut: "",
    date_fin: "",
    services: [],
  });

  async function loadData() {
    const sallesRes = await apiFetch("/api/salles");
    const servicesRes = await apiFetch("/api/services");

    if (sallesRes.res.ok) setSalles(sallesRes.data || []);
    if (servicesRes.res.ok) setServices(servicesRes.data || []);
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleServiceToggle(id) {
    if (form.services.includes(id)) {
      setForm({
        ...form,
        services: form.services.filter((s) => s !== id),
      });
    } else {
      setForm({
        ...form,
        services: [...form.services, id],
      });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.titre || !form.id_salle || !form.date_debut || !form.date_fin) {
      toast.error("Tous les champs sont requis");
      return;
    }

    const { res, data } = await apiFetch("/api/evenements", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        id_salle: Number(form.id_salle),
      }),
    });

    if (res.status === 201) {
      toast.success("Événement créé !");
      setForm({
        titre: "",
        id_salle: "",
        date_debut: "",
        date_fin: "",
        services: [],
      });
    } else {
      toast.error(data?.message || "Erreur création événement");
    }
  }

  return (
    <div className="page">
      <div className="pageHeader">
        <h2>Créer un événement</h2>
        <p className="muted">
          Sélectionner une salle et ajouter des services.
        </p>
      </div>

      <form className="card formGrid" onSubmit={handleSubmit}>
        <div className="field">
          <label>Titre</label>
          <input
            value={form.titre}
            onChange={(e) =>
              setForm({ ...form, titre: e.target.value })
            }
          />
        </div>

        <div className="field">
          <label>Salle</label>
          <select
            value={form.id_salle}
            onChange={(e) =>
              setForm({ ...form, id_salle: e.target.value })
            }
          >
            <option value="">Choisir une salle</option>
            {salles.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nom}
              </option>
            ))}
          </select>
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
          <label>Services</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {services.map((srv) => (
              <label key={srv.id}>
                <input
                  type="checkbox"
                  checked={form.services.includes(srv.id)}
                  onChange={() => handleServiceToggle(srv.id)}
                />
                {srv.nom}
              </label>
            ))}
          </div>
        </div>

        <div className="field fieldEnd">
          <button className="btn btnPrimary" type="submit">
            Créer l'événement
          </button>
        </div>
      </form>
    </div>
  );
}