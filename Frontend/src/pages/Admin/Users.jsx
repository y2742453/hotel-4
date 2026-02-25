// src/pages/Admin/UsersPage.jsx
import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../Api/Client.jsx';
import { useToast } from '../../Components/Toast.jsx';
import '../../styles/table.css';
import '../../styles/forms.css';

const ROLES = [
  { id: 1, label: 'Administrateur' },
  { id: 2, label: 'Organisateur' },
  { id: 3, label: 'Coordonnateur' },
  { id: 4, label: 'Comptabilité' },
];

function formatDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-CA');
}

export default function UsersPage() {
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ nom: '', prenom: '', email: '', id_role: 2 });

  const [form, setForm] = useState({ nom: '', prenom: '', email: '', motDePasse: '', id_role: 2 });

  async function loadUsers() {
    setLoading(true);
    const { res, data } = await apiFetch('/api/admin/users');
    if (res.ok) setUsers(data || []);
    else toast.error(data?.message || "Impossible de charger les utilisateurs");
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  async function handleCreate(e) {
    e.preventDefault();

    if (!form.nom || !form.prenom || !form.email.includes('@') || form.motDePasse.length < 8) {
      toast.error('Champs invalides (mdp min 8)');
      return;
    }

    const { res, data } = await apiFetch('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({ ...form, id_role: Number(form.id_role) }),
    });

    if (res.status === 201) {
      toast.success('Utilisateur créé');
      setForm({ nom: '', prenom: '', email: '', motDePasse: '', id_role: 2 });
      loadUsers();
      return;
    }

    if (res.status === 409) {
      toast.error(data?.message || 'Email déjà utilisé');
      return;
    }

    toast.error(data?.message || "Erreur lors de la création");
  }

  function startEdit(u) {
    setEditId(u.id_user);
    setEditForm({ nom: u.nom, prenom: u.prenom, email: u.email, id_role: u.id_role });
  }

  function cancelEdit() {
    setEditId(null);
  }

  async function saveEdit(id_user) {
    if (!editForm.nom || !editForm.prenom || !editForm.email.includes('@')) {
      toast.error('Nom, prénom et email valide requis');
      return;
    }

    const { res, data } = await apiFetch(`/api/admin/users/${id_user}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...editForm, id_role: Number(editForm.id_role) }),
    });

    if (res.ok) {
      toast.success('Utilisateur modifié');
      setEditId(null);
      loadUsers();
      return;
    }

    if (res.status === 409) {
      toast.error('Email déjà utilisé');
      return;
    }

    toast.error(data?.message || "Modification impossible");
  }

  async function toggleActif(u) {
    const { res, data } = await apiFetch(`/api/admin/users/${u.id_user}/actif`, {
      method: 'PATCH',
      body: JSON.stringify({ actif: u.actif ? 0 : 1 }),
    });

    if (res.ok) {
      toast.success(u.actif ? 'Utilisateur désactivé' : 'Utilisateur activé');
      loadUsers();
    } else {
      toast.error(data?.message || "Impossible de changer l'état");
    }
  }

  async function deleteUser(u) {
    const ok = window.confirm(`Supprimer définitivement ${u.prenom} ${u.nom} ?`);
    if (!ok) return;

    const { res, data } = await apiFetch(`/api/admin/users/${u.id_user}`, { method: 'DELETE' });

    if (res.ok) {
      toast.success('Utilisateur supprimé');
      loadUsers();
    } else {
      toast.error(data?.message || "Suppression impossible");
    }
  }

  return (
    <div className="page">
      <div className="pageHeader">
        <h2>Gestion des utilisateurs</h2>
        <p className="muted">Créer, modifier, désactiver et supprimer des comptes.</p>
      </div>

      <form className="card formGrid" onSubmit={handleCreate}>
        <h3>Créer un utilisateur</h3>

        <div className="grid2">
          <div className="field">
            <label>Nom</label>
            <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
          </div>

          <div className="field">
            <label>Prénom</label>
            <input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
          </div>
        </div>

        <div className="grid2">
          <div className="field">
            <label>Email</label>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>

          <div className="field">
            <label>Mot de passe</label>
            <input type="password" value={form.motDePasse} onChange={(e) => setForm({ ...form, motDePasse: e.target.value })} />
          </div>
        </div>

        <div className="grid2">
          <div className="field">
            <label>Rôle</label>
            <select value={form.id_role} onChange={(e) => setForm({ ...form, id_role: Number(e.target.value) })}>
              {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>

          <div className="field fieldEnd">
            <button className="btn btnPrimary" type="submit">Créer</button>
          </div>
        </div>
      </form>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Liste des utilisateurs</h3>

        <div className="tableWrap">
          {loading ? (
            <div className="muted" style={{ padding: 12 }}>Chargement...</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Inscription</th>
                  <th>Actif</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {users.map((u) => {
                  const isEdit = editId === u.id_user;

                  return (
                    <tr key={u.id_user} className={!u.actif ? 'rowDisabled' : ''}>
                      <td>{isEdit ? <input value={editForm.nom} onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })} /> : u.nom}</td>
                      <td>{isEdit ? <input value={editForm.prenom} onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })} /> : u.prenom}</td>
                      <td>{isEdit ? <input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /> : u.email}</td>

                      <td>
                        {isEdit ? (
                          <select value={editForm.id_role} onChange={(e) => setEditForm({ ...editForm, id_role: Number(e.target.value) })}>
                            {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                          </select>
                        ) : (
                          ROLES.find((r) => r.id === u.id_role)?.label || `Rôle ${u.id_role}`
                        )}
                      </td>

                      <td>{formatDate(u.date_creation)}</td>
                      <td>{u.actif ? 'Oui' : 'Non'}</td>

                      {/* ✅ className actions À METTRE ICI (tu l'avais déjà bon) */}
                      <td className="actions">
                        {isEdit ? (
                          <>
                            <button className="btn btnPrimary" type="button" onClick={() => saveEdit(u.id_user)}>Valider</button>
                            <button className="btn btnGhost" type="button" onClick={cancelEdit}>Annuler</button>
                          </>
                        ) : (
                          <>
                            <button className="btn btnGhost" type="button" onClick={() => startEdit(u)}>Modifier</button>
                            <button className="btn btnWarn" type="button" onClick={() => toggleActif(u)}>
                              {u.actif ? 'Désactiver' : 'Activer'}
                            </button>
                            <button className="btn btnDanger" type="button" onClick={() => deleteUser(u)}>Supprimer</button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {users.length === 0 && (
                  <tr><td colSpan="7" style={{ textAlign: 'center' }}>Aucun utilisateur</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}