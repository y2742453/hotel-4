import React, { useEffect, useState } from "react";
import { apiFetch } from "../../Api/Client.jsx";
import { useToast } from "../../Components/Toast.jsx";
import { useNavigate, useParams, useLocation } from "react-router-dom";

import "../../styles/forms.css";
import "../../styles/table.css";
import "../../styles/evenement.css";

export default function CreerEvenement() {
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEdit = id && id !== "new";
  const isAdmin = location.pathname.includes("admin");

  const [salles, setSalles] = useState([]);

  const [form, setForm] = useState({
    nom_evenement: "",
    type_evenement: "",
    description: "",
    id_salle: "",
    date_debut: "",
    date_fin: "",
    budget: "",
    nb_participants: "",
  });

  const [documents, setDocuments] = useState([]);
  const [file, setFile] = useState(null);

  // =====================
  // LOAD DATA
  // =====================
  async function loadData() {
    const sallesRes = await apiFetch("/api/salles");

    if (sallesRes.res.ok) setSalles(sallesRes.data || []);
  }

  // =====================
  // LOAD EVENT
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
          date_debut: toLocalDatetimeInput(ev.date_debut) || "",
          date_fin: toLocalDatetimeInput(ev.date_fin) || "",
          budget: ev.budget || "",
          nb_participants: ev.nb_participants || "",
        });
      }
    }
  }

  // =====================
  // LOAD DOCUMENTS
  // =====================
  async function loadDocuments(eventId) {
    const { res, data } = await apiFetch(
      `/api/evenements/${eventId}/documents`,
    );
    if (res.ok) setDocuments(data || []);
  }

  // =====================
  // USE EFFECT FINAL
  // =====================
  useEffect(() => {
    loadData();

    if (isEdit) {
      loadEvenement();
      loadDocuments(id);
    }
  }, [id, isEdit]);

  // Route pour redirection vers Calendar.jsx
  useEffect(() => {
    if (location.state) {
      setForm((prev) => ({
        ...prev,
        date_debut: location.state.date_debut || prev.date_debut,
        date_fin: location.state.date_fin || prev.date_fin,
        id_salle: location.state.id_salle || prev.id_salle,
      }));
    }
  }, []);

  // =====================
  // UPLOAD DOCUMENT
  // =====================
  async function uploadDocument(eventId) {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    if (!eventId || eventId === "new") return;
    await fetch(`http://localhost:5001/api/evenements/${eventId}/documents`, {
      method: "POST",
      body: formData,
    });

    setFile(null);
    loadDocuments(eventId);
  }

  // =====================
  // DELETE DOCUMENT
  // =====================
  async function deleteDocument(docId) {
    const confirmDelete = window.confirm("Supprimer ce document ?");
    if (!confirmDelete) return;

    await fetch(`http://localhost:5001/api/documents/${docId}`, {
      method: "DELETE",
    });

    if (isEdit) loadDocuments(id);
  }

  // =====================
  // SUBMIT
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
      budget: form.budget ? Number(form.budget) : null,
      nb_participants: form.nb_participants
        ? Number(form.nb_participants)
        : null,
      id_organisateur: 1,
    };

    const url = isEdit ? `/api/evenements/${id}` : "/api/evenements";
    const method = isEdit ? "PUT" : "POST";

    const { res, data } = await apiFetch(url, {
      method,
      body: JSON.stringify(payload),
    });

    if (res.ok || res.status === 201) {
      const eventId = isEdit ? id : data.id_evenement;

      await uploadDocument(eventId);

      toast.success(isEdit ? "Événement modifié !" : "Événement créé !");
      navigate("/organisateur/evenements");
    } else {
      toast.error(data?.message || "Erreur");
    }
  }

  function toLocalDatetimeInput(dateString) {
    const d = new Date(dateString);

    const pad = (n) => String(n).padStart(2, "0");

    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // =====================
  // UI
  // =====================
  return (
    <div className="evenement-page">
      <div className="main-card">
        <h2>{isEdit ? "Modifier événement" : "Créer un événement"}</h2>

        <form className="formGrid" onSubmit={handleSubmit}>
          <div className="field">
            <label>Nom événement</label>
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

          <div className="field">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div className="grid2">
            <div className="field">
              <label>Budget ($)</label>
              <input
                type="number"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
              />
            </div>

            <div className="field">
              <label>Nombre de participants</label>
              <input
                type="number"
                value={form.nb_participants}
                onChange={(e) =>
                  setForm({ ...form, nb_participants: e.target.value })
                }
              />
            </div>
          </div>

          <div className="field">
            <label>Salle</label>
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
                onChange={(e) => setForm({ ...form, date_fin: e.target.value })}
              />
            </div>
          </div>

          {/* UPLOAD DOCUMENT - visible uniquement pour non-admin */}
          {!isAdmin && (
            <div className="field">
              <label>Ajouter un document</label>
              <input
                type="file"
                disabled={isAdmin}
                onChange={(e) => setFile(e.target.files[0] || null)}
              />
              {file && (
                <div style={{ marginTop: 4, fontSize: "0.95em" }}>
                  Fichier sélectionné : <b>{file.name}</b>
                </div>
              )}
            </div>
          )}

          <button type="submit" className="btnPrimary">
            {isEdit ? "Modifier" : "Créer l'événement"}
          </button>
        </form>
      </div>
    </div>
  );
}
