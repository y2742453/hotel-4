import React, { useEffect, useState } from "react";
import { apiFetch } from "../Api/Client.jsx";
import { useToast } from "./Toast.jsx";
import "../styles/global.css";
import "../styles/forms.css";

export default function NotificationPreferences({ onClose }) {
  const toast = useToast();

  const [form, setForm] = useState({
    canal_interne: true,
    canal_email: false,
    canal_sms: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadPreferences() {
    setLoading(true);

    try {
      const { res, data } = await apiFetch("/api/notification-preferences");

      if (res.ok && data) {
        setForm({
          canal_interne: !!data.canal_interne,
          canal_email: !!data.canal_email,
          canal_sms: !!data.canal_sms,
        });
      } else {
        toast.error("Impossible de charger les préférences");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur de chargement");
    }

    setLoading(false);
  }

  useEffect(() => {
    loadPreferences();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    try {
      const { res, data } = await apiFetch("/api/notification-preferences", {
        method: "PUT",
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success("Préférences enregistrées avec succès");
        if (onClose) onClose();
      } else {
        toast.error(data?.message || "Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur serveur");
    }

    setSaving(false);
  }

  return (
    <div className="notifPrefs">
      <div className="notifPrefsHeader">
        <h2>Préférences de notifications</h2>
        <p className="muted">
          Choisissez comment vous souhaitez recevoir vos notifications.
        </p>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <form onSubmit={handleSubmit} className="notifPrefsForm">
          <label className="notifPrefItem">
            <input
              type="checkbox"
              checked={form.canal_interne}
              onChange={(e) =>
                setForm({ ...form, canal_interne: e.target.checked })
              }
            />
            <div>
              <div className="notifPrefTitle">Notifications internes</div>
              <div className="notifPrefText">
                Recevoir les notifications directement dans la cloche de
                l’application.
              </div>
            </div>
          </label>

          <label className="notifPrefItem">
            <input
              type="checkbox"
              checked={form.canal_email}
              onChange={(e) =>
                setForm({ ...form, canal_email: e.target.checked })
              }
            />
            <div>
              <div className="notifPrefTitle">Notifications par email</div>
              <div className="notifPrefText">
                Recevoir les notifications importantes par courrier
                électronique.
              </div>
            </div>
          </label>

          <label className="notifPrefItem">
            <input
              type="checkbox"
              checked={form.canal_sms}
              onChange={(e) =>
                setForm({ ...form, canal_sms: e.target.checked })
              }
            />
            <div>
              <div className="notifPrefTitle">Notifications par SMS</div>
              <div className="notifPrefText">
                Recevoir les notifications importantes par message texte.
              </div>
            </div>
          </label>

          <div className="notifPrefsActions">
            <button className="btn btnPrimary" type="submit" disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>

            <button
              type="button"
              className="btn btnGhost"
              onClick={async () => {
                await loadPreferences();
                if (onClose) onClose();
              }}
              disabled={saving}
            >
              Réinitialiser
            </button>
          </div>
        </form>
      )}
    </div>
  );
}