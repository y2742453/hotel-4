// src/pages/Admin/UsersPage.jsx
import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../Api/Client.jsx';
import '../../styles/table.css';
import '../../styles/forms.css';

function formatDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-CA') + ' ' + d.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
}

const ROLES = [
  { id: 1, label: 'Administrateur' },
  { id: 2, label: 'Organisateur' },
  { id: 3, label: 'Coordonnateur' },
  { id: 4, label: 'Comptabilité' },
];

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    id_role: 2,
  });

  async function loadUsers() {
    setLoading(true);
    setMsg(null);

    const { res, data } = await apiFetch('/api/admin/users');
    if (res.ok) {
      setUsers(data || []);
    } else {
      setUsers([]);
      setMsg({ type: 'error', text: data?.message || "Impossible de charger les utilisateurs" });
    }

    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setMsg(null);

    if (!form.nom || !form.prenom || !form.email.includes('@') || form.motDePasse.length < 8) {
      setMsg({ type: 'error', text: 'Champs invalides (mdp min 8)' });
      return;
    }

    const payload = { ...form, id_role: Number(form.id_role) };

    const { res, data } = await apiFetch('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.status === 201) {
      setMsg({ type: 'success', text: 'Utilisateur créé' });
      setForm({ nom: '', prenom: '', email: '', motDePasse: '', id_role: 2 });
      loadUsers();
    } else if (res.status === 409) {
      setMsg({ type: 'error', text: data?.message || 'Email déjà utilisé' });
    } else {
      setMsg({ type: 'error', text: data?.message || "Erreur lors de la création" });
    }
  }

  async function handleChangeRole(id_user, id_role) {
    setMsg(null);
    const { res, data } = await apiFetch(`/api/admin/users/${id_user}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ id_role: Number(id_role) }),
    });

    if (res.ok) {
      setMsg({ type: 'success', text: 'Rôle mis à jour' });
      loadUsers();
    } else {
      setMsg({ type: 'error', text: data?.message || "Impossible de modifier le rôle" });
    }
  }

  async function handleToggleActif(id_user, actif) {
    setMsg(null);
    const { res, data } = await apiFetch(`/api/admin/users/${id_user}/actif`, {
      method: 'PATCH',
      body: JSON.stringify({ actif: actif ? 0 : 1 }),
    });

    if (res.ok) {
      setMsg({ type: 'success', text: actif ? 'Utilisateur désactivé' : 'Utilisateur activé' });
      loadUsers();
    } else {
      setMsg({ type: 'error', text: data?.message || "Impossible de modifier l'état" });
    }
  }

  // OPTIONNEL : suppression définitive
  async function handleDelete(id_user) {
    const ok = window.confirm("Supprimer définitivement cet utilisateur ?");
    if (!ok) return;

    setMsg(null);
    const { res, data } = await apiFetch(`/api/admin/users/${id_user}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setMsg({ type: 'success', text: 'Utilisateur supprimé' });
      loadUsers();
    } else {
      setMsg({ type: 'error', text: data?.message || "Suppression impossible" });
    }
  }

  return (
    <div>
      <h2>Gestion des utilisateurs</h2>
      <p className="muted">Créer, modifier rôle, activer/désactiver et consulter la date d’inscription.</p>

      {/* FORM CREATE */}
      <form className="formRow" onSubmit={handleCreate}>
        <input placeholder="Nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
        <input placeholder="Prénom" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
        <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Mot de passe" type="password" value={form.motDePasse} onChange={(e) => setForm({ ...form, motDePasse: e.target.value })} />

        <select value={form.id_role} onChange={(e) => setForm({ ...form, id_role: Number(e.target.value) })}>
          {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>

        <button className="btn btnPrimary" type="submit">Créer</button>
      </form>

      {msg && (
        <div className={msg.type === 'error' ? 'msg msgError' : 'msg msgSuccess'}>
          {msg.text}
        </div>
      )}

      {/* TABLE */}
      <div className="tableWrap" style={{ marginTop: 16 }}>
        {loading ? (
          <div className="muted" style={{ padding: 10 }}>Chargement...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Date inscription</th>
                <th>Actif</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map(u => (
                <tr key={u.id_user}>
                  <td>{u.nom}</td>
                  <td>{u.prenom}</td>
                  <td>{u.email}</td>

                  <td>
                    <select
                      value={u.id_role}
                      onChange={(e) => handleChangeRole(u.id_user, e.target.value)}
                    >
                      {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                  </td>

                  <td>{formatDate(u.date_creation)}</td>
                  <td>{u.actif ? 'Oui' : 'Non'}</td>

                  <td style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn btnGhost" onClick={() => handleToggleActif(u.id_user, u.actif)}>
                      {u.actif ? 'Désactiver' : 'Activer'}
                    </button>

                    {/* OPTIONNEL: delete */}
                    <button className="btn btnDanger" type="button" onClick={() => handleDelete(u.id_user)}>
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center' }}>
                    Aucun utilisateur
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
