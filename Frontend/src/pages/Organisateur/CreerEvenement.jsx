import React, { useEffect, useState } from "react";
import { apiFetch } from "../../Api/Client.jsx";
import { useToast } from "../../Components/Toast.jsx";
import { useNavigate, useParams, useLocation } from "react-router-dom";

import "../../styles/evenement.css";

const TYPES_EVENEMENT = [
  "Mariage",
  "Réunion",
  "Séminaire",
  "Conférence",
  "Gala",
  "Atelier",
  "Formation",
  "Anniversaire",
  "Autre",
];

export default function CreerEvenement() {
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEdit = Boolean(id && id !== "new");
  const isAdmin = location.pathname.includes("admin");
  const basePath = isAdmin ? "/admin" : "/organisateur";

  // ── État du formulaire ──
  const [form, setForm] = useState({
    nom_evenement: "",
    type_evenement: "",
    description: "",
    id_salle: "",
    date_debut: "",
    date_fin: "",
    nb_participants: "",
    budget: "",
    statut: "Brouillon",
  });

  const [salles, setSalles] = useState([]);
  const [services, setServices] = useState([]); // liste complète
  const [servicesChoisis, setServicesChoisis] = useState([]); // ids sélectionnés
  const [documents, setDocuments] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // ── Chargement données initiales ──
  useEffect(() => {
    async function init() {
      const { res: rs, data: ds } = await apiFetch("/api/salles");
      if (rs.ok) setSalles(ds || []);

      const { res: rv, data: dv } = await apiFetch("/api/services");
      if (rv.ok) setServices(dv || []);

      if (isEdit) {
        const { res: re, data: de } = await apiFetch("/api/evenements");
        if (re.ok) {
          const ev = (de || []).find((e) => e.id_evenement == id);
          if (ev) {
            setForm({
              nom_evenement: ev.nom_evenement || "",
              type_evenement: ev.type_evenement || "",
              description: ev.description || "",
              id_salle: ev.id_salle || "",
              date_debut: toLocalDatetimeInput(ev.date_debut),
              date_fin: toLocalDatetimeInput(ev.date_fin),
              nb_participants:
                ev.nb_participants != null ? String(ev.nb_participants) : "",
              budget: ev.budget != null ? String(ev.budget) : "",
              statut: ev.statut || "Brouillon",
            });
          }
        }

        const { res: rse, data: dse } = await apiFetch(
          `/api/evenements/${id}/services`,
        );
        if (rse.ok) {
          setServicesChoisis((dse || []).map((s) => s.id_service));
        }

        const { res: rd, data: dd } = await apiFetch(
          `/api/evenements/${id}/documents`,
        );
        if (rd.ok) setDocuments(dd || []);
      }
    }

    init();
  }, [id, isEdit]);

  useEffect(() => {
    if (location.state?.selected) {
      const { id_salle, date_debut, date_fin } = location.state.selected;

      setForm((prev) => ({
        ...prev,
        id_salle,
        date_debut: toLocalDatetimeInput(date_debut),
        date_fin: toLocalDatetimeInput(date_fin),
      }));

      window.history.replaceState({}, document.title);
    }
  }, [location.key]);

  // ── Toggle service ──
  function toggleService(idService) {
    setServicesChoisis((prev) =>
      prev.includes(idService)
        ? prev.filter((s) => s !== idService)
        : [...prev, idService],
    );
  }

  // ── Upload document ──
  async function uploadDocument(eventId) {
    if (!file || !eventId || eventId === "new") return;
    const fd = new FormData();
    fd.append("file", file);
    await fetch(
      `https://hotel-4.up.railway.app/api/evenements/${eventId}/documents`,
      {
        method: "POST",
        body: fd,
      },
    );
    setFile(null);
    const { res, data } = await apiFetch(
      `/api/evenements/${eventId}/documents`,
    );
    if (res.ok) setDocuments(data || []);
  }

  // ── Supprimer document ──
  async function deleteDocument(docId) {
    if (!window.confirm("Supprimer ce document ?")) return;
    await fetch(`https://hotel-4.up.railway.app/api/documents/${docId}`, {
      method: "DELETE",
    });
    if (isEdit) {
      const { res, data } = await apiFetch(`/api/evenements/${id}/documents`);
      if (res.ok) setDocuments(data || []);
    }
  }

  // ── Soumission (créer ou modifier) ──
  async function handleSubmit(e, statutOverride) {
    e.preventDefault();

    if (!form.nom_evenement.trim()) {
      toast.error("Le nom de l'événement est requis.");
      return;
    }
    if (!form.id_salle) {
      toast.error("Veuillez choisir une salle.");
      return;
    }
    if (!form.date_debut || !form.date_fin) {
      toast.error("Les dates de début et de fin sont requises.");
      return;
    }

    const payload = {
      nom_evenement: form.nom_evenement,
      type_evenement: form.type_evenement,
      description: form.description,
      id_salle: Number(form.id_salle),
      date_debut: form.date_debut,
      date_fin: form.date_fin,
      nb_participants: form.nb_participants
        ? Number(form.nb_participants)
        : null,
      budget: form.budget ? Number(form.budget) : null,
      statut: statutOverride || form.statut,
      services: servicesChoisis,
      id_organisateur: 1,
    };

    const url = isEdit ? `/api/evenements/${id}` : "/api/evenements";
    const method = isEdit ? "PUT" : "POST";

    setLoading(true);
    const { res, data } = await apiFetch(url, {
      method,
      body: JSON.stringify(payload),
    });
    setLoading(false);

    if (res.ok || res.status === 201) {
      const eventId = isEdit ? id : data?.id_evenement;
      await uploadDocument(eventId);
      toast.success(isEdit ? "Événement modifié !" : "Événement créé !");
      navigate(`${basePath}/evenements`);
    } else {
      toast.error(data?.message || "Une erreur est survenue.");
    }
  }

  function toLocalDatetimeInput(dateString) {
    if (!dateString) return "";

    // Already in datetime-local format
    if (dateString.includes("T") && !dateString.endsWith("Z")) {
      return dateString.slice(0, 16);
    }

    // ISO format from API (UTC)
    const date = new Date(dateString);
    if (!isNaN(date)) {
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - offset * 60000);
      return localDate.toISOString().slice(0, 16);
    }

    // MySQL DATETIME format
    const [datePart, timePart] = dateString.split(" ");
    if (datePart && timePart) {
      return `${datePart}T${timePart.slice(0, 5)}`;
    }

    return "";
  }

  function set(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  // ─────────────────────────────────────────
  return (
    <div className="evenement-page">
      <div className="main-card">
        <h2>{isEdit ? "Modifier l'événement" : "Créer un événement"}</h2>

        <form className="formGrid" onSubmit={(e) => handleSubmit(e, null)}>
          {/* ── Section : Informations générales ── */}
          <div className="form-section-label">Informations générales</div>

          {/* Nom */}
          <div className="field">
            <label htmlFor="nom">
              Nom de l'événement <span className="required">*</span>
            </label>
            <input
              id="nom"
              type="text"
              placeholder="Ex : Séminaire annuel RH"
              autoComplete="off"
              value={form.nom_evenement}
              onChange={set("nom_evenement")}
            />
          </div>

          {/* Type — menu déroulant */}
          <div className="field">
            <label htmlFor="type">
              Type d'événement <span className="required">*</span>
            </label>
            <select
              id="type"
              value={form.type_evenement}
              onChange={set("type_evenement")}
            >
              <option value="">-- Choisir un type --</option>
              {TYPES_EVENEMENT.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="field">
            <label htmlFor="desc">Description</label>
            <textarea
              id="desc"
              rows={3}
              placeholder="Décrivez le contexte et les objectifs de l'événement…"
              value={form.description}
              onChange={set("description")}
            />
          </div>

          {/* Participants + Budget côte à côte */}
          <div className="grid2">
            <div className="field">
              <label htmlFor="participants">
                Nombre estimé de participants
              </label>
              <input
                id="participants"
                type="number"
                min="1"
                placeholder="Ex : 50"
                value={form.nb_participants}
                onChange={set("nb_participants")}
              />
            </div>
            <div className="field">
              <label htmlFor="budget">Budget prévisionnel ($)</label>
              <input
                id="budget"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ex : 5000"
                value={form.budget}
                onChange={set("budget")}
              />
            </div>
          </div>

          {/* ── Section : Lieu et dates ── */}
          <div className="form-section-label" style={{ marginTop: "8px" }}>
            Lieu et dates
          </div>

          {/* Salle */}
          <div className="field">
            <label htmlFor="salle">
              Salle souhaitée <span className="required">*</span>
            </label>
            <select id="salle" value={form.id_salle} onChange={set("id_salle")}>
              <option value="">-- Choisir une salle --</option>
              {salles.map((s) => (
                <option key={s.id_salle} value={s.id_salle}>
                  {s.nom_salle} — capacité {s.capacite}
                </option>
              ))}
            </select>
          </div>

          {/* Dates côte à côte */}
          <div className="grid2">
            <div className="field">
              <label htmlFor="date_debut">
                Date et heure de début <span className="required">*</span>
              </label>
              <input
                id="date_debut"
                type="datetime-local"
                value={form.date_debut}
                onChange={set("date_debut")}
              />
            </div>
            <div className="field">
              <label htmlFor="date_fin">
                Date et heure de fin <span className="required">*</span>
              </label>
              <input
                id="date_fin"
                type="datetime-local"
                value={form.date_fin}
                onChange={set("date_fin")}
              />
            </div>
          </div>

          {/* ── Section : Documents ── */}
          {!isAdmin && (
            <>
              <div className="form-section-label" style={{ marginTop: "8px" }}>
                Documents
              </div>

              <div className="field">
                <label htmlFor="doc">
                  Joindre un document (PDF, image, plan…)
                </label>
                <input
                  id="doc"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setFile(e.target.files[0] || null)}
                />
                {file && (
                  <span className="file-info">
                    Fichier sélectionné : <strong>{file.name}</strong>
                  </span>
                )}
              </div>

              {isEdit && documents.length > 0 && (
                <div className="field">
                  <label>Documents déjà joints</label>
                  <div className="documentsBox">
                    {documents.map((doc) => (
                      <div className="docCard" key={doc.id}>
                        <span>📄 {doc.nom_fichier}</span>
                        <button
                          type="button"
                          className="btn btnDanger"
                          onClick={() => deleteDocument(doc.id)}
                        >
                          Supprimer
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Actions ── */}
          <div className="form-actions">
            {/* Créer / Modifier */}
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading
                ? "Enregistrement…"
                : isEdit
                  ? "Enregistrer les modifications"
                  : "Créer l'événement"}
            </button>

            {/* Annuler */}
            <button
              type="button"
              className="btn-submit btn-ghost"
              onClick={() => navigate(`${basePath}/evenements`)}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
