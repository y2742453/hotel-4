import { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import frLocale from "@fullcalendar/core/locales/fr";

import { apiFetch } from "../../Api/Client";
import { useToast } from "../../Components/Toast";

import "../../styles/Calendar.css";

const Calendar = () => {
  const calendarRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [salles, setSalles] = useState([]);
  const [evenements, setEvenements] = useState([]);
  const [selectedSalle, setSelectedSalle] = useState(null);
  const [selectedEvenement, setSelectedEvenement] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);

  const [filtreCapacite, setFiltreCapacite] = useState("");
  const [filtreEquipement, setFiltreEquipement] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const [modalMessage, setModalMessage] = useState("");

  const [newReservation, setNewReservation] = useState({
    dateDebut: "",
    dateFin: "",
  });

  const getInitialView = () =>
    typeof window !== "undefined" && window.innerWidth <= 768
      ? "timeGridDay"
      : "timeGridWeek";

  const [initialView, setInitialView] = useState(getInitialView());

  // Fonctions utilitaires
  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formatDateForMySQL = (dateString) => {
    return dateString.replace("T", " ") + ":00";
  };

  function normalizeDate(dateString) {
    if (!dateString) return null;
    return dateString.replace(" ", "T").replace(".000Z", "").replace("Z", "");
  }

  function formatDisplayDate(dateString) {
    if (!dateString) return "";

    const [datePart, timePart] = dateString.split("T");
    const [year, month, day] = datePart.split("-");

    return `${day}/${month}/${year} à ${timePart}`;
  }

  // Filtrer les salles
  const sallesFiltrees = salles.filter((salle) => {
    if ((salle.statut || "").toLowerCase() !== "disponible") {
      return false;
    }

    // Filtre par capacité
    if (filtreCapacite && salle.capacite < Number(filtreCapacite)) {
      return false;
    }

    // Filtre par équipement
    if (filtreEquipement) {
      const equipements = (salle.equipements || "").toLowerCase();
      const recherche = filtreEquipement.toLowerCase().trim();

      const listeEquipements = equipements.split(",").map((e) => e.trim());

      const trouve = listeEquipements.some((eq) => eq.includes(recherche));

      if (!trouve) {
        return false;
      }
    }

    return true;
  });

  // Gestion du resize
  useEffect(() => {
    const handleResize = () => {
      setInitialView(window.innerWidth <= 768 ? "timeGridDay" : "timeGridWeek");
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Chargement initial
  useEffect(() => {
    chargerSalles();
    chargerEvenements();
  }, []);

  // Charger les réservations quand la salle change
  useEffect(() => {
    if (selectedSalle) {
      chargerReservations();
    } else {
      setEvents([]);
    }
  }, [selectedSalle]);

  // Réinitialiser la salle si elle n'est plus dans les filtres
  useEffect(() => {
    if (selectedSalle) {
      const salleValide = sallesFiltrees.some(
        (s) => s.id_salle === selectedSalle,
      );

      if (!salleValide) {
        toast.info("La salle sélectionnée ne correspond plus aux filtres.");
        setSelectedSalle(null);
        setEvents([]);
      }
    }
  }, [sallesFiltrees, selectedSalle]);

  /**
   * Récupère la liste des salles depuis l'API
   */
  async function chargerSalles() {
    try {
      const { res, data } = await apiFetch("/api/reservation/salles");
      if (!res.ok) throw new Error("Erreur réseau");
      setSalles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erreur chargement salles:", error);
      toast.error("Erreur lors du chargement des salles.");
    }
  }

  /**
   * Récupère les événements disponibles
   */
  async function chargerEvenements() {
    try {
      const { res, data } = await apiFetch("/api/reservation/evenements");

      if (!res.ok) throw new Error("Erreur réseau");

      setEvenements(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erreur chargement événements:", error);
      toast.error("Erreur lors du chargement des événements.");
    }
  }

  /**
   * Charge les réservations pour la salle sélectionnée
   * et les transforme pour FullCalendar
   */
  async function chargerReservations() {
    try {
      const { res, data } = await apiFetch(
        `/api/reservation/salle/${selectedSalle}`,
      );
      if (!res.ok) throw new Error("Erreur réseau");
      const reservations = data;

      setEvents(
        reservations.map((r) => ({
          id: r.id_reservation,
          title: r.nom_evenement,
          start: normalizeDate(r.date_debut),
          end: normalizeDate(r.date_fin),
          extendedProps: {
            description: r.description,
          },
        })),
      );
    } catch (error) {
      console.error("Erreur chargement réservations:", error);
      toast.error("Erreur lors du chargement des réservations.");
    }
  }

  /* CALENDAR HANDLERS */
  const handleEventClick = (info) => {
    setSelectedReservation(info.event);
    setShowEventModal(true);
  };

  const handleSelectSlot = (info) => {
    if (!selectedSalle) {
      toast.info("Veuillez d'abord sélectionner une salle.");
      calendarRef.current?.getApi().unselect();
      return;
    }

    setNewReservation({
      dateDebut: formatDateForInput(info.start),
      dateFin: formatDateForInput(info.end),
    });

    setModalMessage("");
    setSelectedEvenement(null);
    setShowCreateModal(true);

    navigate("/organisateur/evenements/creer", {
      state: {
        date_debut: formatDateForInput(info.start),
        date_fin: formatDateForInput(info.end),
        id_salle: selectedSalle,
      },
    });

    calendarRef.current?.getApi().unselect();
  };

  async function handleCreateClick() {
    // Validations complètes
    if (!selectedSalle) {
      setModalMessage("Veuillez sélectionner une salle.");
      return;
    }

    const salleValide = sallesFiltrees.some(
      (s) => s.id_salle === selectedSalle,
    );
    if (!salleValide) {
      setModalMessage("La salle sélectionnée n'est plus disponible.");
      return;
    }

    if (!selectedEvenement) {
      setModalMessage("Veuillez sélectionner un événement.");
      return;
    }

    // Vérifier que les dates sont valides
    const debut = new Date(newReservation.dateDebut);
    const fin = new Date(newReservation.dateFin);

    if (fin <= debut) {
      setModalMessage("La date de fin doit être après la date de début.");
      return;
    }

    setModalMessage("");
    setShowConfirmModal(true);
  }

  /**
   * Envoie la réservation au backend
   * et recharge le calendrier après création
   */
  async function creerReservation() {
    if (loading) return;
    setLoading(true);
    setModalMessage("");

    const payload = {
      idSalle: selectedSalle,
      idEvenement: selectedEvenement,
      dateDebut: formatDateForMySQL(newReservation.dateDebut),
      dateFin: formatDateForMySQL(newReservation.dateFin),
    };

    try {
      const { res } = await apiFetch("/api/reservation", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        if (res.status === 409) {
          setModalMessage("Cette salle est déjà réservée pour cette période.");
        } else {
          setModalMessage("Erreur serveur. Veuillez réessayer.");
        }
        return;
      }

      setShowCreateModal(false);
      setShowConfirmModal(false);
      setSelectedEvenement(null);

      toast.success("Réservation créée avec succès.");

      chargerReservations();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur serveur.");
    } finally {
      setLoading(false);
    }
  }

  /**
   * Supprime une réservation existante
   * puis recharge le calendrier
   */
  async function handleDelete() {
    if (!selectedReservation) return;

    try {
      const { res } = await apiFetch(
        `/api/reservation/${selectedReservation.id}`,
        {
          method: "DELETE",
        },
      );

      if (!res.ok) {
        toast.error("Erreur lors de la suppression.");
        return;
      }

      setShowEventModal(false);
      toast.success("Réservation supprimée.");
      chargerReservations();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la suppression.");
    }
  }

  return (
    <div className="calendar-container">
      <h1>Réservation de salles</h1>

      {/* SECTION FILTRES */}
      <div className="filters-section">
        <h3>Filtres</h3>

        <div className="filters-row">
          <div className="filter-group">
            <label>Capacité minimale:</label>
            <input
              type="number"
              placeholder="Ex: 30"
              value={filtreCapacite}
              onChange={(e) => setFiltreCapacite(e.target.value)}
              min="0"
            />
          </div>

          <div className="filter-group">
            <label>Équipement:</label>
            <input
              type="text"
              placeholder="Ex: Projecteur"
              value={filtreEquipement}
              onChange={(e) => setFiltreEquipement(e.target.value)}
            />
          </div>

          <button
            className="btn-reset-filters"
            onClick={() => {
              setFiltreCapacite("");
              setFiltreEquipement("");
              setSelectedSalle(null);
              setEvents([]);
            }}
          >
            Réinitialiser
          </button>
        </div>

        <p className="filter-count">
          {sallesFiltrees.length} salle{sallesFiltrees.length !== 1 ? "s" : ""}{" "}
          disponible{sallesFiltrees.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* SÉLECTEUR DE SALLE */}
      <div className="salle-selector">
        <label>Salle:</label>

        <select
          value={selectedSalle || ""}
          onChange={(e) => {
            const newSalle = Number(e.target.value);
            setSelectedSalle(newSalle);
          }}
        >
          <option value="" disabled>
            {sallesFiltrees.length === 0
              ? "Aucune salle disponible"
              : "Sélectionner une salle"}
          </option>
          {sallesFiltrees.map((s) => (
            <option key={s.id_salle} value={s.id_salle}>
              {s.nom_salle} — Capacité: {s.capacite}
            </option>
          ))}
        </select>
      </div>

      {/* DÉTAILS DE LA SALLE SÉLECTIONNÉE */}
      {selectedSalle && (
        <div className="salle-details">
          {(() => {
            const salle = salles.find((s) => s.id_salle === selectedSalle);
            if (!salle) return null;

            return (
              <div className="details-card">
                <h3>{salle.nom_salle}</h3>
                <p>
                  <strong>Capacité:</strong> {salle.capacite} personnes
                </p>
                <p>
                  <strong>Équipements:</strong> {salle.equipements || "Aucun"}
                </p>
                <p>
                  <strong>Statut:</strong>{" "}
                  <span
                    className={`status ${salle.statut.toLowerCase() === "disponible" ? "available" : "unavailable"}`}
                  >
                    {salle.statut}
                  </span>
                </p>
              </div>
            );
          })()}
        </div>
      )}

      {/* CALENDRIER */}
      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
        initialView={initialView}
        locale={frLocale}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        validRange={{
          start: new Date().toISOString().split("T")[0],
        }}
        selectable={!!selectedSalle}
        select={handleSelectSlot}
        eventClick={handleEventClick}
        events={events}
        slotMinTime="07:00:00"
        slotMaxTime="22:00:00"
        allDaySlot={false}
        height="auto"
        buttonText={{
          today: "Aujourd'hui",
          month: "Mois",
          week: "Semaine",
          day: "Jour",
        }}
      />

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowCreateModal(false);
            setModalMessage("");
          }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nouvelle réservation</h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateClick();
              }}
            >
              <div className="form-group">
                <label>Événement:</label>
                <select
                  value={selectedEvenement || ""}
                  onChange={(e) => setSelectedEvenement(Number(e.target.value))}
                  onInvalid={(e) => {
                    e.preventDefault();
                    setModalMessage("Veuillez sélectionner un événement.");
                  }}
                >
                  <option value="" disabled>
                    Sélectionner un événement
                  </option>

                  {evenements
                    .filter((ev) => ev.id_salle === selectedSalle)
                    .map((ev) => (
                      <option key={ev.id_evenement} value={ev.id_evenement}>
                        {ev.nom_evenement}
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label>Date de début:</label>
                <input
                  type="datetime-local"
                  value={newReservation.dateDebut}
                  onChange={(e) =>
                    setNewReservation({
                      ...newReservation,
                      dateDebut: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Date de fin:</label>
                <input
                  type="datetime-local"
                  value={newReservation.dateFin}
                  onChange={(e) =>
                    setNewReservation({
                      ...newReservation,
                      dateFin: e.target.value,
                    })
                  }
                  required
                />
              </div>

              {modalMessage && (
                <div className="message-error modal-error">{modalMessage}</div>
              )}

              <div className="modal-buttons">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setModalMessage("");
                  }}
                >
                  Annuler
                </button>
                <button type="submit">Vérifier disponibilité</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {showConfirmModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowConfirmModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2> Confirmer la réservation</h2>

            {(() => {
              const salle = salles.find((s) => s.id_salle === selectedSalle);
              const evenement = evenements.find(
                (ev) => ev.id_evenement === selectedEvenement,
              );
              return (
                <div>
                  <p>
                    Voulez-vous réserver la salle{" "}
                    <strong>{salle?.nom_salle}</strong> pour l'événement{" "}
                    <strong>{evenement?.nom_evenement}</strong> ?
                  </p>
                  <p className="confirmation-dates">
                    Du
                    {formatDisplayDate(newReservation.dateDebut)}
                    <br />
                    au
                    {formatDisplayDate(newReservation.dateFin)}
                  </p>
                </div>
              );
            })()}

            <div className="modal-buttons">
              <button type="button" onClick={() => setShowConfirmModal(false)}>
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  creerReservation();
                }}
                disabled={loading}
                className="btn-confirm"
              >
                {loading ? "Création..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EVENT MODAL */}
      {showEventModal && selectedReservation && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div
            className="modal modal-event"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{selectedReservation.title}</h2>

            <p className="event-dates">
              {" "}
              {selectedReservation.start.toLocaleString("fr-FR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
              {" → "}
              {selectedReservation.end?.toLocaleString("fr-FR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>

            <p className="event-description">
              {selectedReservation.extendedProps.description ||
                "Aucune description"}
            </p>

            <div className="modal-buttons">
              <button onClick={() => setShowEventModal(false)}>Fermer</button>
              <button className="btn-delete" onClick={handleDelete}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
