import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { apiFetch } from "../../Api/Client.jsx";
import { useToast } from "../../Components/Toast.jsx";
import "../../styles/table.css";
import "../../styles/forms.css";
import "../../styles/global.css";

export default function EvenementServices() {
  const { id_evenement } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "form";
  const isDetailsMode = mode === "details";

  const toast = useToast();

  const [services, setServices] = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    id_service: "",
    quantite: 1,
    montant_estime: 0,
    details: "",
  });

  async function chargerServices() {
    const { res, data } = await apiFetch("/api/services");

    if (!res.ok) {
      toast.error(data?.message || "Impossible de charger les services");
      return;
    }

    const liste = Array.isArray(data) ? data : [];
    setServices(liste);

    if (liste.length > 0) {
      setForm((prev) => ({
        ...prev,
        id_service: prev.id_service || String(liste[0].id_service),
      }));
    }
  }

  async function chargerDemandes() {
    const { res, data } = await apiFetch(
      `/api/evenementservices/evenement/${id_evenement}`
    );

    if (!res.ok) {
      toast.error(data?.message || "Impossible de charger les demandes");
      return;
    }

    setDemandes(Array.isArray(data) ? data : []);
  }

  async function chargerPage() {
    setLoading(true);
    await Promise.all([chargerServices(), chargerDemandes()]);
    setLoading(false);
  }

  useEffect(() => {
    if (id_evenement) {
      chargerPage();
    }
  }, [id_evenement]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.id_service) {
      toast.error("Veuillez sélectionner un service");
      return;
    }

    if (!form.details.trim()) {
      toast.error("Veuillez préciser les besoins");
      return;
    }

    setSaving(true);

    const { res, data } = await apiFetch("/api/evenementservices", {
      method: "POST",
      body: JSON.stringify({
        id_evenement: Number(id_evenement),
        id_service: Number(form.id_service),
        quantite: Number(form.quantite),
        montant_estime: Number(form.montant_estime),
        details: form.details.trim(),
      }),
    });

    setSaving(false);

    if (!res.ok) {
      toast.error(data?.message || "Erreur lors de la création de la demande");
      return;
    }

    toast.success("Besoin ajouté avec succès");

    setForm((prev) => ({
      ...prev,
      quantite: 1,
      montant_estime: 0,
      details: "",
    }));

    await chargerDemandes();
  }

  function renderStatut(statut) {
    if (statut === "Valide") return "Validé";
    if (statut === "Refuse") return "Refusé";
    return "En attente";
  }

  function formatDetails(details) {
    if (details === null || details === undefined || details === "") {
      return "Aucun détail";
    }

    if (typeof details === "string") {
      return details;
    }

    if (typeof details === "object") {
      return Object.entries(details)
        .map(([key, value]) => `${key} : ${String(value)}`)
        .join(" | ");
    }

    return String(details);
  }

  const titre = useMemo(() => {
    return isDetailsMode
      ? `Détails des besoins — Événement #${id_evenement}`
      : `Spécifier les besoins — Événement #${id_evenement}`;
  }, [id_evenement, isDetailsMode]);

  return (
    <div className="page">
      <div className="pageHeader">
        <h2>{titre}</h2>
        <p className="muted">
          {isDetailsMode
            ? "Consultez les besoins déjà enregistrés pour cet événement."
            : "Précisez ici les besoins liés à votre événement, notamment la restauration."}
        </p>
      </div>

      {!isDetailsMode && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3>Ajouter un besoin</h3>

          <form className="form" onSubmit={handleSubmit}>
            <div className="formRow">
              <div style={{ flex: 1 }}>
                <label>Service</label>
                <select
                  value={form.id_service}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, id_service: e.target.value }))
                  }
                >
                  {services.map((service) => (
                    <option key={service.id_service} value={service.id_service}>
                      {service.nom_service}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <label>Quantité</label>
                <input
                  type="number"
                  min="1"
                  value={form.quantite}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, quantite: e.target.value }))
                  }
                />
              </div>

              <div style={{ flex: 1 }}>
                <label>Montant estimé</label>
                <input
                  type="number"
                  min="0"
                  value={form.montant_estime}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      montant_estime: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <label>Besoins détaillés</label>
              <textarea
                rows="6"
                value={form.details}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, details: e.target.value }))
                }
                style={{
                  width: "100%",
                  border: "1px solid #d7e1ef",
                  borderRadius: "12px",
                  padding: "10px 12px",
                  background: "#ffffff",
                }}
                placeholder="Exemple : buffet pour 80 personnes, options végétariennes, sans arachides, boissons incluses..."
              />
            </div>

            <div className="formRow" style={{ marginTop: 12 }}>
              <button className="btn btnPrimary" type="submit" disabled={saving}>
                {saving ? "Enregistrement..." : "Ajouter"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h3>Liste des besoins</h3>

        <div className="tableWrap">
          {loading ? (
            <div className="muted" style={{ padding: 12 }}>
              Chargement...
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Quantité</th>
                  <th>Montant estimé</th>
                  <th>Statut</th>
                  <th>Date demande</th>
                  <th>Détails</th>
                </tr>
              </thead>

              <tbody>
                {demandes.map((demande) => (
                  <tr key={`${demande.id_evenement}-${demande.id_service}`}>
                    <td>{demande.nom_service}</td>
                    <td>{demande.quantite}</td>
                    <td>{demande.montant_estime}</td>
                    <td>{renderStatut(demande.statut)}</td>
                    <td>
                      {demande.date_demande
                        ? new Date(demande.date_demande).toLocaleString()
                        : "-"}
                    </td>
                    <td style={{ maxWidth: 420, whiteSpace: "pre-wrap" }}>
                      {formatDetails(demande.details)}
                    </td>
                  </tr>
                ))}

                {demandes.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center" }}>
                      Aucun besoin spécifié pour cet événement
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}