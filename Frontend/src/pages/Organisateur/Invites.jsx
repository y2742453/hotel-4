// src/pages/Organisateur/Invites.jsx
import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { useToast } from "../../Components/Toast.jsx";
import { apiFetch } from "../../Api/Client.jsx";
import "../../styles/invites.css";

export default function Invites() {
  const toast = useToast();

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [invites, setInvites] = useState([]);

  const [file, setFile] = useState(null);

  // Modal state
  const [editingInvite, setEditingInvite] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    statut: "invite",
  });

  const statutLabels = {
    invite: "Invité",
    confirme: "Confirmé",
    refuse: "Refusé",
    en_attente: "En attente",
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) loadInvites();
    else setInvites([]);
  }, [selectedEvent]);

  const loadEvents = async () => {
    const { res, data } = await apiFetch("/api/evenements");
    if (res.ok) setEvents(data);
  };

  const loadInvites = async () => {
    const { res, data } = await apiFetch(
      `/api/invites/event/${selectedEvent.id_evenement}`,
    );
    if (res.ok) setInvites(data);
  };

  // ADD INVITE
  const handleAdd = async () => {
    try {
      const { res } = await apiFetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          id_evenement: selectedEvent.id_evenement,
        }),
      });

      if (res.ok) {
        toast.success("Invité ajouté");
        setIsAdding(false);
        loadInvites();
      } else {
        toast.error("Erreur ajout");
      }
    } catch (err) {
      toast.error("Erreur serveur");
    }
  };

  // EDIT INVITE
  const handleEdit = async () => {
    try {
      const { res } = await apiFetch(
        `/api/invites/${editingInvite.id_invite}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
      );

      if (res.ok) {
        toast.success("Mis à jour");
        setEditingInvite(null);
        loadInvites();
      } else {
        toast.error("Erreur");
      }
    } catch {
      toast.error("Erreur serveur");
    }
  };

  // DELETE
  const handleDelete = async (id) => {
    const { res } = await apiFetch(`/api/invites/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setInvites((prev) => prev.filter((i) => i.id_invite !== id));
    } else {
      toast.error("Erreur suppression");
    }
  };

  // IMPORT
  const handleImport = async () => {
    if (!file || !selectedEvent) return;

    let rows = [];

    if (file.type.includes("csv")) {
      const text = await file.text();
      const parsed = Papa.parse(text, { header: true });
      rows = parsed.data;
    } else {
      const workbook = XLSX.read(await file.arrayBuffer());
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet);
    }

    await apiFetch(`/api/invites/import/${selectedEvent.id_evenement}`, {
      method: "POST",
      body: JSON.stringify({ rows }),
    });

    toast.success("Import terminé");
    loadInvites();
  };

  return (
    <div className="page invites-page">
      <h2>Gestion des Invités</h2>

      {/* SELECT EVENT */}
      <select
        value={selectedEvent?.id_evenement || ""}
        onChange={(e) =>
          setSelectedEvent(
            events.find((ev) => ev.id_evenement === Number(e.target.value)),
          )
        }
      >
        <option value="">Choisir événement</option>
        {events.map((ev) => (
          <option key={ev.id_evenement} value={ev.id_evenement}>
            {ev.nom_evenement}
          </option>
        ))}
      </select>

      {selectedEvent && (
        <>
          {/* ACTIONS */}
          <div className="actions">
            <button
              className="btnPrimary"
              onClick={() => {
                setIsAdding(true);
                setFormData({
                  nom: "",
                  prenom: "",
                  email: "",
                  statut: "invite",
                });
              }}
            >
              Ajouter un invité
            </button>

            <input type="file" onChange={(e) => setFile(e.target.files[0])} />

            <button onClick={handleImport} className="btnSecondary">
              Import
            </button>
          </div>

          {/* TABLE */}
          <table className="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Email</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {invites.map((i) => (
                <tr key={i.id_invite}>
                  <td>{i.nom}</td>
                  <td>{i.prenom}</td>
                  <td>{i.email}</td>
                  <td>
                    <span className={`status ${i.statut}`}>
                      {statutLabels[i.statut] || i.statut}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => {
                        setEditingInvite(i);
                        setFormData(i);
                      }}
                      className="btnSecondary"
                    >
                      Modifier
                    </button>

                    <button
                      onClick={() => handleDelete(i.id_invite)}
                      className="btnDanger"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* MODAL (ADD / EDIT) */}
      {(editingInvite || isAdding) && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{isAdding ? "Ajouter" : "Modifier"} un invité</h3>

            <input
              placeholder="Nom"
              value={formData.nom}
              onChange={(e) =>
                setFormData({ ...formData, nom: e.target.value })
              }
            />

            <input
              placeholder="Prénom"
              value={formData.prenom}
              onChange={(e) =>
                setFormData({ ...formData, prenom: e.target.value })
              }
            />

            <input
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />

            <select
              value={formData.statut}
              onChange={(e) =>
                setFormData({ ...formData, statut: e.target.value })
              }
            >
              <option value="invite">Invité</option>
              <option value="confirme">Confirmé</option>
              <option value="refuse">Refusé</option>
              <option value="en_attente">En attente</option>
            </select>

            <div className="modal-actions">
              <button
                onClick={isAdding ? handleAdd : handleEdit}
                className="btnPrimary"
              >
                Sauvegarder
              </button>

              <button
                onClick={() => {
                  setEditingInvite(null);
                  setIsAdding(false);
                }}
                className="btnSecondary"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
