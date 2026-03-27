// src/pages/Organisateur/Invites.jsx
import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { useToast } from "../../Components/Toast.jsx";
import { API_BASE, apiFetch } from "../../Api/Client.jsx";
import "../../styles/invites.css";
import { FaUpload, FaDownload } from "react-icons/fa";

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
  const [updatedRow, setUpdatedRow] = useState(null);

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
      if (!formData.nom || !formData.prenom || !formData.email) {
        toast.error("Champs manquants");
        return;
      }

      const { res, data } = await apiFetch("/api/invites", {
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
        toast.error(data?.error || "Erreur pendant l'ajout");
      }
    } catch {
      toast.error("Erreur serveur");
    }
  };

  const handleEdit = async () => {
    try {
      if (!formData.nom || !formData.prenom || !formData.email) {
        toast.error("Champs manquants");
        return;
      }

      const { res, data } = await apiFetch(
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
        toast.error(data?.error || "Erreur");
      }
    } catch {
      toast.error("Erreur serveur");
    }
  };

  const handleDelete = async (id) => {
    const { res, data } = await apiFetch(`/api/invites/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setInvites((prev) => prev.filter((i) => i.id_invite !== id));
      loadStats();
    } else {
      toast.error(data?.error || "Erreur suppression");
    }
  };

  const updateStatut = async (id, statut) => {
    try {
      const { res, data } = await apiFetch(`/api/invites/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut }),
      });

      if (res.ok) {
        setUpdatedRow(id);
        loadInvites();
        toast.success("Statut mis à jour");

        setTimeout(() => setUpdatedRow(null), 800);
      } else {
        toast.error(data?.error || "Erreur");
      }
    } catch {
      toast.error("Erreur serveur");
    }
  };

  // IMPORT
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

    const { res, data } = await apiFetch(
      `/api/invites/import/${selectedEvent.id_evenement}`,
      {
        method: "POST",
        body: JSON.stringify({ rows }),
      },
    );

    if (!res.ok) {
      toast.error(data?.error || "Erreur import");
      return;
    }

    toast.success(
      `Import terminé: ${data.success} succès, ${data.errors} erreurs`,
    );
    setFile(null);
    loadInvites();
  };

  // EXPORT
  const handleExport = () => {
    if (!selectedEvent) return;
    const link = document.createElement("a");
    link.href = `${API_BASE}/api/invites/export/${selectedEvent.id_evenement}`;
    link.download = `invites_event_${selectedEvent.id_evenement}.csv`;
    link.click();
  };

  // SEND ONE
  const sendInvite = async (id) => {
    try {
      const { res, data } = await apiFetch(`/api/invites/send/${id}`, {
        method: "POST",
      });

      if (!res.ok) throw new Error(data?.error);

      toast.success("Invitation envoyée");
      loadInvites();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Erreur envoi");
    }
  };

  return (
    <div className="page invites-page">
      <h2>Gestion des Invités</h2>
      <div className="card main-card">
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
            <div className="actions">
              <div className="actions-left">
                <input
                  type="text"
                  placeholder="Rechercher"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <button
                  className="btn btnPrimaraire"
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
                  Ajouter
                </button>
              </div>

              <div className="actions-right">
                <label htmlFor="file-upload" className="custom-file-upload">
                  <FaUpload /> {file ? file.name : "Fichier"}
                </label>

                <input
                  id="file-upload"
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                />

                <div className="tooltip">
                  <button
                    onClick={handleImport}
                    className="btn btnSecondary"
                    disabled={!file}
                  >
                    Import
                  </button>

                  {!file && (
                    <span className="tooltip-text">
                      Sélectionnez un fichier d'abord
                    </span>
                  )}
                </div>

                <div className="tooltip">
                  <button
                    onClick={handleExport}
                    className="btn btnSecondary"
                    disabled={!selectedEvent || invites.length === 0}
                  >
                    <FaDownload style={{ marginRight: "10px" }} />
                    Export
                  </button>

                  {(!selectedEvent || invites.length === 0) && (
                    <span className="tooltip-text">
                      Aucun invité à exporter
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="stats">
              <div>En attente: {stats.en_attente}</div>
              <div>Invités: {stats.invite}</div>
              <div>Confirmés: {stats.confirme}</div>
              <div>Refusés: {stats.refuse}</div>
            </div>

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
                  <tr
                    key={i.id_invite}
                    className={updatedRow === i.id_invite ? "updated" : ""}
                  >
                    <td>{i.nom}</td>
                    <td>{i.prenom}</td>
                    <td>{i.email}</td>
                    <td>
                      <select
                        value={i.statut}
                        onChange={(e) =>
                          updateStatut(i.id_invite, e.target.value)
                        }
                      >
                        <option value="en_attente">En attente</option>
                        <option value="invite">Invité</option>
                        <option value="confirme">Confirmé</option>
                        <option value="refuse">Refusé</option>
                      </select>
                    </td>

                    <td>
                      <div className="tooltip">
                        <button
                          className="btn btnPrimaraire"
                          disabled={i.statut !== "en_attente"}
                          onClick={() => sendInvite(i.id_invite)}
                        >
                          Inviter
                        </button>

                        {i.statut !== "en_attente" && (
                          <span className="tooltip-text">
                            Déjà traité (non modifiable)
                          </span>
                        )}
                      </div>

                      <button
                        className="btn btnSecondary"
                        onClick={() => {
                          setEditingInvite(i);
                          setFormData({
                            nom: i.nom,
                            prenom: i.prenom,
                            email: i.email,
                            statut: i.statut,
                          });
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
          </>
        )}
      </div>
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

            <div className="modal-actions">
              <button
                onClick={isAdding ? handleAdd : handleEdit}
                className="btn btnPrimaraire"
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
  );
}
