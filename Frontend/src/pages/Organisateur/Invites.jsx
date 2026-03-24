// src/pages/Organisateur/Invites.jsx
import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { useToast } from "../../Components/Toast.jsx";
import { API_BASE, apiFetch } from "../../Api/Client.jsx";
import "../../styles/invites.css";
import { FaUpload } from "react-icons/fa";

export default function Invites() {
  const toast = useToast();

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [invites, setInvites] = useState([]);
  const [stats, setStats] = useState({
    en_attente: 0,
    invite: 0,
    confirme: 0,
    refuse: 0,
  });

  const [file, setFile] = useState(null);
  const [search, setSearch] = useState("");

  const [editingInvite, setEditingInvite] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    statut: "en_attente",
  });

  const statutLabels = {
    invite: "Invité",
    confirme: "Confirmé",
    refuse: "Refusé",
    en_attente: "En attente",
  };

  const invitesFiltres = invites.filter((inv) => {
    const recherche = search.toLowerCase().trim();
    return (
      inv.nom.toLowerCase().includes(recherche) ||
      inv.prenom.toLowerCase().includes(recherche) ||
      inv.email.toLowerCase().includes(recherche)
    );
  });

  // Chargements des événements et des invités
  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) loadInvites();
    else {
      setInvites([]);
      setStats({ en_attente: 0, invite: 0, confirme: 0, refuse: 0 });
    }
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
    loadStats();
  };

  const loadStats = async () => {
    if (!selectedEvent) return;
    const { res, data } = await apiFetch(
      `/api/invites/stats/${selectedEvent.id_evenement}`,
    );
    if (res.ok) setStats(data);
  };

  // CRUD
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
      } else toast.error("Erreur ajout");
    } catch {
      toast.error("Erreur serveur");
    }
  };

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
      } else toast.error("Erreur");
    } catch {
      toast.error("Erreur serveur");
    }
  };

  const handleDelete = async (id) => {
    const { res } = await apiFetch(`/api/invites/${id}`, { method: "DELETE" });
    if (res.ok) {
      setInvites((prev) => prev.filter((i) => i.id_invite !== id));
      loadStats();
    } else toast.error("Erreur suppression");
  };

  // Imports
  const handleImport = async () => {
    if (!file || !selectedEvent) return;

    let rows = [];
    if (file.type.includes("csv")) {
      const text = await file.text();
      rows = Papa.parse(text, { header: true }).data;
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
    setFile(null);
    loadInvites();
  };

  // Export
  const handleExport = () => {
    if (!selectedEvent) return;
    const link = document.createElement("a");
    link.href = `${API_BASE}/api/invites/export/${selectedEvent.id_evenement}`;
    link.download = `invites_event_${selectedEvent.id_evenement}.csv`;
    link.click();
  };

  return (
    <div className="page invites-page">
      <h2>Gestion des Invités</h2>
      <p className="muted">
        Sélectionner un événement, importer, exporter et gérer une liste
        d'invités.
      </p>

      <div className="card main-card">
        {/* SELECT EVENT */}
        <select
          value={selectedEvent?.id_evenement || ""}
          onChange={(e) =>
            setSelectedEvent(
              events.find((ev) => ev.id_evenement === Number(e.target.value)),
            )
          }
        >
          <option value="" disabled>
            Sélectionner un événement
          </option>
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
              <div className="actions-left">
                <input
                  type="text"
                  placeholder="Rechercher (nom, prénom, email)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button
                  className="btn btnPrimary"
                  onClick={() => {
                    setIsAdding(true);
                    setFormData({
                      nom: "",
                      prenom: "",
                      email: "",
                      statut: "en_attente",
                    });
                  }}
                >
                  Ajouter un invité
                </button>
              </div>

              <div className="actions-right">
                <label htmlFor="file-upload" className="custom-file-upload">
                  <FaUpload /> {file ? file.name : "Choisissez un fichier"}
                </label>
                <input
                  id="file-upload"
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                />
                {file && (
                  <span className="clear-file" onClick={() => setFile(null)}>
                    ×
                  </span>
                )}

                <button onClick={handleImport} className="btn btnSecondary">
                  Import
                </button>
                <button onClick={handleExport} className="btn btnSecondary">
                  Export CSV
                </button>
              </div>
            </div>

            {/* STATS */}
            <div className="stats">
              <p className={`en_attente`}>En attente: {stats.en_attente}</p>
              <p className={`invite`}>Invité: {stats.invite}</p>
              <p className={`confirme`}>Confirmé: {stats.confirme}</p>
              <p className={`refuse`}>Refusé: {stats.refuse}</p>
            </div>

            {/* TABLE */}
            <h3>Liste des invités</h3>
            <div className="tableWrap">
              {invitesFiltres.length === 0 ? (
                <div className="muted" style={{ padding: 12 }}>
                  Aucun invité
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Prénom</th>
                      <th>Email</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitesFiltres.map((i) => (
                      <tr key={i.id_invite}>
                        <td>{i.nom}</td>
                        <td>{i.prenom}</td>
                        <td>{i.email}</td>
                        <td>
                          <span className={`status ${i.statut}`}>
                            {statutLabels[i.statut]}
                          </span>
                        </td>
                        <td className="actions">
                          <button
                            className="btn btnSecondary"
                            onClick={() => {
                              setEditingInvite(i);
                              setFormData(i);
                            }}
                          >
                            Modifier
                          </button>
                          <button
                            className="btn btnDanger"
                            onClick={() => handleDelete(i.id_invite)}
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
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
                <option value="en_attente">En attente</option>
                <option value="invite">Invité</option>
                <option value="confirme">Confirmé</option>
                <option value="refuse">Refusé</option>
              </select>

              <div className="modal-actions">
                <button
                  onClick={isAdding ? handleAdd : handleEdit}
                  className="btn btnPrimary"
                >
                  Sauvegarder
                </button>
                <button
                  onClick={() => {
                    setEditingInvite(null);
                    setIsAdding(false);
                  }}
                  className="btn btnSecondary"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
