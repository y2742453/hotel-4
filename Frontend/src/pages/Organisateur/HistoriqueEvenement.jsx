import { useEffect, useState } from "react";
import { apiFetch } from "../../Api/Client.jsx";
import {
  FaCalendarAlt, FaBuilding, FaUsers, FaDollarSign,
  FaCheckCircle, FaTimesCircle, FaClock, FaSearch,
  FaRedo,
} from "react-icons/fa";
import "../../styles/historique.css";

export default function HistoriqueEvenements() {
  const [events,     setEvents]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [filtStatut, setFiltStatut] = useState("");
  const [dateDebut,  setDateDebut]  = useState("");
  const [dateFin,    setDateFin]    = useState("");

  useEffect(() => {
    apiFetch("/api/historique")
      .then(({ res, data }) => { if (res.ok) setEvents(data || []); })
      .finally(() => setLoading(false));
  }, []);

  function reset() {
    setSearch(""); setFiltStatut(""); setDateDebut(""); setDateFin("");
  }

  function getStatutStyle(statut) {
    const v = (statut || "").toLowerCase();
    if (v === "confirmé" || v === "confirme") return { bg: "#dcfce7", color: "#166534", icon: <FaCheckCircle /> };
    if (v === "annulé"   || v === "annule")   return { bg: "#fee2e2", color: "#b91c1c", icon: <FaTimesCircle /> };
    if (v === "terminé"  || v === "termine")  return { bg: "#f1f5f9", color: "#475569", icon: <FaClock /> };
    return { bg: "#fef3c7", color: "#92400e", icon: <FaClock /> };
  }

  function formatDate(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("fr-CA", {
      year: "numeric", month: "long", day: "numeric",
    });
  }

  function formatDateShort(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("fr-CA", {
      year: "numeric", month: "short", day: "numeric",
    });
  }

  const statuts = [...new Set(events.map((e) => e.statut).filter(Boolean))];

  const filtered = events.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      e.nom_evenement?.toLowerCase().includes(q) ||
      e.type_evenement?.toLowerCase().includes(q) ||
      e.nom_salle?.toLowerCase().includes(q) ||
      `${e.organisateur_prenom} ${e.organisateur_nom}`.toLowerCase().includes(q);
    const matchStatut = !filtStatut || e.statut === filtStatut;
    const matchDebut  = !dateDebut  || new Date(e.date_debut) >= new Date(dateDebut);
    const matchFin    = !dateFin    || new Date(e.date_fin)   <= new Date(dateFin);
    return matchSearch && matchStatut && matchDebut && matchFin;
  });

  // Stats rapides
  const total     = filtered.length;
  const confirmes = filtered.filter(e => (e.statut||"").toLowerCase().includes("confirm")).length;
  const annules   = filtered.filter(e => (e.statut||"").toLowerCase().includes("annul")).length;
  const termines  = filtered.filter(e => (e.statut||"").toLowerCase().includes("termin")).length;

  return (
    <div className="histo-page">

      {/* ══ BANDEAU EN-TÊTE ══ */}
      <div className="histo-banner">
        <div className="histo-banner-left">
          <div className="histo-banner-icon"><FaCalendarAlt /></div>
          <div>
            <h2 className="histo-banner-title">
              Historique des événements
              <span className="histo-banner-badge">{total} entrées</span>
            </h2>
            <p className="histo-banner-sub">
              Consultez l'ensemble des événements passés, en cours et annulés.
            </p>
            <div className="histo-banner-stats">
              <span><FaCheckCircle style={{ color: "#4ade80" }} /> {confirmes} confirmés</span>
              <span><FaClock style={{ color: "#fbbf24" }} /> {termines} terminés</span>
              <span><FaTimesCircle style={{ color: "#f87171" }} /> {annules} annulés</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══ FILTRES ══ */}
      <div className="histo-filters-card">
        <div className="histo-filters-title">
          <FaSearch style={{ fontSize: "13px" }} /> Filtres
        </div>
        <div className="histo-filters-row">
          <div className="histo-filter-group">
            <FaCalendarAlt className="histo-filter-icon" />
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="histo-input"
            />
          </div>
          <div className="histo-filter-group">
            <FaCalendarAlt className="histo-filter-icon" />
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="histo-input"
            />
          </div>
          <div className="histo-filter-group">
            <FaSearch className="histo-filter-icon" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="histo-input"
            />
          </div>
          <div className="histo-filter-group">
            <select
              value={filtStatut}
              onChange={(e) => setFiltStatut(e.target.value)}
              className="histo-input histo-select"
            >
              <option value="">Tous les statuts</option>
              {statuts.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button className="histo-btn-reset" onClick={reset}>
            <FaRedo /> Réinitialiser
          </button>
        </div>
      </div>

      {/* ══ LISTE EN-TÊTES ══ */}
      <div className="histo-list-header">
        <span>DATE</span>
        <span>ÉVÉNEMENT</span>
        <span>SALLE</span>
        <span>ORGANISATEUR</span>
        <span>STATUT</span>
        <span>DÉTAILS</span>
      </div>

      {/* ══ LIGNES ══ */}
      {loading ? (
        <div className="histo-empty">Chargement…</div>
      ) : filtered.length === 0 ? (
        <div className="histo-empty">Aucun événement trouvé</div>
      ) : (
        <div className="histo-list">
          {filtered.map((e) => {
            const s = getStatutStyle(e.statut);
            return (
              <div className="histo-row" key={e.id_evenement}>

                {/* Date */}
                <div className="histo-col-date">
                  <div className="histo-date-main">{formatDateShort(e.date_debut)}</div>
                  <div className="histo-date-sub">→ {formatDateShort(e.date_fin)}</div>
                </div>

                {/* Événement */}
                <div className="histo-col-event">
                  <div className="histo-event-name">{e.nom_evenement}</div>
                  <div className="histo-event-type">{e.type_evenement || "—"}</div>
                </div>

                {/* Salle */}
                <div className="histo-col-salle">
                  <FaBuilding className="histo-col-icon" />
                  {e.nom_salle || "—"}
                </div>

                {/* Organisateur */}
                <div className="histo-col-org">
                  <div className="histo-org-avatar">
                    {(e.organisateur_prenom?.[0] || "?")}{(e.organisateur_nom?.[0] || "")}
                  </div>
                  <div>
                    <div className="histo-org-name">
                      {e.organisateur_prenom} {e.organisateur_nom}
                    </div>
                  </div>
                </div>

                {/* Statut */}
                <div className="histo-col-statut">
                  <span
                    className="histo-statut-badge"
                    style={{ background: s.bg, color: s.color }}
                  >
                    {s.icon} {e.statut}
                  </span>
                </div>

                {/* Détails */}
                <div className="histo-col-details">
                  {e.nb_participants != null && (
                    <div className="histo-detail-item">
                      <span className="histo-detail-label">
                        <FaUsers /> Participants
                      </span>
                      <span className="histo-detail-value">{e.nb_participants}</span>
                    </div>
                  )}
                  {e.budget != null && Number(e.budget) > 0 && (
                    <div className="histo-detail-item">
                      <span className="histo-detail-label">
                        <FaDollarSign /> Budget
                      </span>
                      <span className="histo-detail-value">
                        {Number(e.budget).toLocaleString("fr-CA", {
                          style: "currency", currency: "CAD", maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ══ COMPTEUR ══ */}
      {!loading && (
        <p className="histo-count">
          {filtered.length} événement{filtered.length !== 1 ? "s" : ""} affiché{filtered.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}