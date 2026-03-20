import React, { useEffect, useState } from "react";
import { apiFetch } from "../../Api/Client.jsx";
import { useToast } from "../../Components/Toast.jsx";
import { useNavigate, useParams } from "react-router-dom";

import "../../styles/forms.css";
import "../../styles/table.css";

export default function CreerEvenement() {
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams(); // 🔥 IMPORTANT

  const isEdit = !!id; // 🔥 mode modifier

  const [salles, setSalles] = useState([]);
  const [services, setServices] = useState([]);

  const [form, setForm] = useState({
    nom_evenement: "",
    type_evenement: "",
    description: "",
    id_salle: "",
    date_debut: "",
    date_fin: "",
    services: [],
  });

  // =====================
  // LOAD SALLES + SERVICES
  // =====================
  async function loadData() {
    const sallesRes = await apiFetch("/api/salles");
    const servicesRes = await apiFetch("/api/services");

    if (sallesRes.res.ok) setSalles(sallesRes.data || []);
    if (servicesRes.res.ok) setServices(servicesRes.data || []);
  }

  // =====================
  // LOAD EVENT SI MODIFIER
  // =====================
  async function loadEvenement() {
    const { res, data } = await apiFetch("/api/evenements");

    if (res.ok) {
      const ev = data.find((e) => e.id_evenement == id);
      if (ev) {
        setForm({
          nom_evenement: ev.nom_evenement || "",
          type_evenement: ev.type_evenement || "",
          description: ev.description || "",
          id_salle: ev.id_salle || "",
          date_debut: ev.date_debut?.slice(0, 16) || "",
          date_fin: ev.date_fin?.slice(0, 16) || "",
          services: ev.services || [],
        });
      }
    }
  }

  useEffect(() => {
    loadData();
    if (isEdit) loadEvenement();
  }, [id]);

  // =====================
  // SERVICES
  // =====================
  function handleServiceToggle(idService) {
    if (form.services.includes(idService)) {
      setForm({
        ...form,
        services: form.services.filter((s) => s !== idService),
      });
    } else {
      setForm({
        ...form,
        services: [...form.services, idService],
      });
    }
  }

  // =====================
  // SUBMIT (CREATE / UPDATE)
  // =====================
  async function handleSubmit(e) {
    e.preventDefault();

    if (
      !form.nom_evenement ||
      !form.id_salle ||
      !form.date_debut ||
      !form.date_fin
    ) {
      toast.error("Tous les champs sont requis");
      return;
    }

    const payload = {
      ...form,
      id_salle: Number(form.id_salle),
      id_organisateur: 1,
    };

    const url = isEdit
      ? `/api/evenements/${id}`
      : "/api/evenements";

    const method = isEdit ? "PUT" : "POST";

    const { res, data } = await apiFetch(url, {
      method,
      body: JSON.stringify(payload),
    });

    if (res.ok || res.status === 201) {
      toast.success(
        isEdit
          ? "Événement modifié !"
          : "Événement créé !"
      );
      navigate("/organisateur/evenements");
    } else {
      toast.error(data?.message || "Erreur");
    }
  }

  // =====================
  // UI
  // =====================
  return (
    <div className="page">
      {/* HEADER */}
      <div
        className="pageHeader"
        style={{
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h2>
            {isEdit ? "Modifier événement" : "Créer un événement"}
          </h2>
          <p className="muted">
            {isEdit
              ? "Modifier les informations"
              : "Créer un nouvel événement"}
          </p>
        </div>

        <button
          className="btn"
          onClick={() => navigate("/organisateur/evenements")}
        >
          ← Retour
        </button>
      </div>

      {/* FORM */}
      <form className="card formGrid" onSubmit={handleSubmit}>
        {/* NOM */}
        <div className="field">
          <label>Nom événement</label>
          <input
            value={form.nom_evenement}
            onChange={(e) =>
              setForm({ ...form, nom_evenement: e.target.value })
            }
          />
        </div>

        {/* TYPE */}
        <div className="field">
          <label>Type</label>
          <input
            value={form.type_evenement}
            onChange={(e) =>
              setForm({ ...form, type_evenement: e.target.value })
            }
          />
        </div>

        {/* DESCRIPTION */}
        <div className="field">
          <label>Description</label>
          <input
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />
        </div>

        {/* SALLE */}
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
              <option key={s.id_salle} value={s.id_salle}>
                {s.nom_salle}
              </option>
            ))}
          </select>
        </div>

        {/* DATES */}
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

        {/* SERVICES */}
        <div className="field">
          <label>Services</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {services.map((srv) => (
              <label key={srv.id_service}>
                <input
                  type="checkbox"
                  checked={form.services.includes(srv.id_service)}
                  onChange={() =>
                    handleServiceToggle(srv.id_service)
                  }
                />
                {srv.nom_service}
              </label>
            ))}
          </div>
        </div>

        {/* SUBMIT */}
        <div className="field fieldEnd">
          <button className="btn btnPrimary">
            {isEdit ? "Modifier" : "Créer"}
          </button>
        </div>
      </form>
    </div>
  );
}