import React, { useEffect, useState } from "react";
import { apiFetch } from "../../Api/Client.jsx";
import { useToast } from "../../Components/Toast.jsx";
import { useNavigate, useParams } from "react-router-dom";

import "../../styles/forms.css";
import "../../styles/table.css";
import "../../styles/evenement.css";

export default function CreerEvenement() {
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = id && id !== "new";

  const [salles, setSalles] = useState([]);
  const [services, setServices] = useState([]);
  const [servicesEvent, setServicesEvent] = useState([]);

  const [form, setForm] = useState({
    nom_evenement: "",
    type_evenement: "",
    description: "",
    id_salle: "",
    date_debut: "",
    date_fin: "",
    services: [],
  });

  const [documents, setDocuments] = useState([]);
  const [file, setFile] = useState(null);

  // =====================
  // LOAD DATA
  // =====================
  async function loadData() {
    const sallesRes = await apiFetch("/api/salles");
    const servicesRes = await apiFetch("/api/services");

    if (sallesRes.res.ok) setSalles(sallesRes.data || []);
    if (servicesRes.res.ok) setServices(servicesRes.data || []);
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
          date_debut: ev.date_debut?.slice(0, 16) || "",
          date_fin: ev.date_fin?.slice(0, 16) || "",
          services: [],
        });
      }
    }
  }

  // =====================
  // LOAD SERVICES CHECKED
  // =====================
  async function loadServicesChecked() {
    const { res, data } = await apiFetch(
      `/api/evenements/${id}/services`
    );

    if (res.ok) {
      const ids = data.map((s) => Number(s.id_service));

      setForm((prev) => ({
        ...prev,
        services: ids,
      }));
    }
  }

  // =====================
  // LOAD DOCUMENTS
  // =====================
  async function loadDocuments(eventId) {
    const { res, data } = await apiFetch(
      `/api/evenements/${eventId}/documents`
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
      loadServicesChecked();
      loadDocuments(id);
    }
  }, [id, isEdit]);

  // =====================
  // SERVICES TOGGLE
  // =====================
  function handleServiceToggle(idService) {
    idService = Number(idService);

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
  // LOAD SERVICES LIST
  // =====================
  useEffect(() => {
    async function loadServices() {
      if (!isEdit) return;
      const res = await apiFetch(`/api/evenements/${id}/services`);
      setServicesEvent(res.data);
    }

    if (isEdit) loadServices();
  }, [id, isEdit]);

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

    console.log("SUBMIT OK");
    console.log("FORM:", form);

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
      services: form.services.map(Number),
    };

    console.log("PAYLOAD ENVOYÉ:", payload);

    const url = isEdit ? `/api/evenements/${id}` : "/api/evenements";
    const method = isEdit ? "PUT" : "POST";

    const { res, data } = await apiFetch(url, {
      method,
      body: JSON.stringify(payload),
    });

    console.log("REPONSE API:", res.status, data);

    if (res.ok || res.status === 201) {
      const eventId = isEdit ? id : data.id_evenement;

      await uploadDocument(eventId);

      toast.success(isEdit ? "Événement modifié !" : "Événement créé !");
      navigate("/organisateur/evenements");
    } else {
      toast.error(data?.message || "Erreur");
    }
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

            <div className="servicesGrid">
              {services.map((srv) => (
                <div
                  key={srv.id_service}
                  className={`serviceCard ${
                    form.services.includes(Number(srv.id_service))
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    handleServiceToggle(Number(srv.id_service))
                  }
                >
                  <input
                    type="checkbox"
                    checked={form.services.includes(
                      Number(srv.id_service)
                    )}
                    readOnly
                  />
                  <span>{srv.nom_service}</span>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="btnPrimary">
            {isEdit ? "Modifier" : "Créer l'événement"}
          </button>
        </form>
      </div>
    </div>
  );
}