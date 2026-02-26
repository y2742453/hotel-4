import { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import frLocale from "@fullcalendar/core/locales/fr";
import "../../styles/Calendar.css";

const Calendar = () => {
  const calendarRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [salles, setSalles] = useState([]);
  const [evenements, setEvenements] = useState([]);
  const [selectedSalle, setSelectedSalle] = useState(null);
  const [selectedEvenement, setSelectedEvenement] = useState(null);

  const [selectedEvent, setSelectedEvent] = useState(null);

  const [filtreCapacite, setFiltreCapacite] = useState("");
  const [filtreEquipement, setFiltreEquipement] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  const [newReservation, setNewReservation] = useState({
    dateDebut: "",
    dateFin: "",
  });

  const [initialView, setInitialView] = useState(
    window.innerWidth <= 768 ? "timeGridDay" : "timeGridWeek",
  );

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

  // Extraire tous les équipements uniques
  const tousLesEquipements = (() => {
    const equipementsSet = new Set();

    salles.forEach((salle) => {
      if (salle.equipements) {
        const liste = salle.equipements.split(",").map((e) => e.trim());
        liste.forEach((eq) => {
          if (eq) equipementsSet.add(eq);
        });
      }
    });

    return Array.from(equipementsSet).sort();
  })();

  // Filtrer les salles
  const sallesFiltrees = salles.filter((salle) => {
    // Seulement les salles disponibles
    if (salle.statut !== "Disponible") {
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
      setEvents([]); // Vider le calendrier si pas de salle
    }
  }, [selectedSalle]);

  // Réinitialiser la salle si elle n'est plus dans les filtres
  useEffect(() => {
    if (selectedSalle) {
      const salleValide = sallesFiltrees.some(
        (s) => s.id_salle === selectedSalle,
      );

      if (!salleValide) {
        console.log("⚠️ Salle désélectionnée car filtrée");
        setSelectedSalle(null);
        setEvents([]);
      }
    }
  }, [sallesFiltrees, selectedSalle]);

  async function chargerSalles() {
    try {
      const res = await fetch("http://localhost:5001/api/salles");
      if (!res.ok) throw new Error("Erreur réseau");
      const data = await res.json();
      setSalles(data);
    } catch (error) {
      console.error("Erreur chargement salles:", error);
      setMessage("Erreur lors du chargement des salles.");
    }
  }

  async function chargerEvenements() {
    try {
      const res = await fetch("http://localhost:5001/api/evenements");
      if (!res.ok) throw new Error("Erreur réseau");
      const data = await res.json();
      setEvenements(data);
    } catch (error) {
      console.error("Erreur chargement événements:", error);
      setMessage("Erreur lors du chargement des événements.");
    }
  }

  async function chargerReservations() {
    setMessage("");

    try {
      const res = await fetch(
        `http://localhost:5001/api/reservation/salle/${selectedSalle}`,
      );
      if (!res.ok) throw new Error("Erreur réseau");
      const reservations = await res.json();

      setEvents(
        reservations.map((r) => ({
          id: r.id_reservation,
          title: r.nom_evenement,
          start: r.date_debut,
          end: r.date_fin,
          extendedProps: {
            description: r.description,
          },
        })),
      );
    } catch (error) {
      console.error("Erreur chargement réservations:", error);
      setMessage("Erreur lors du chargement des réservations.");
    }
  }

  /* CALENDAR HANDLERS */
  const handleEventClick = (info) => {
    setSelectedEvent(info.event);
    setShowEventModal(true);
  };

  const handleSelectSlot = (info) => {
    // Vérifier qu'une salle est sélectionnée
    if (!selectedSalle) {
      setMessage("Veuillez d'abord sélectionner une salle.");
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

    // On affiche directement la confirmation
    setModalMessage("");
    setShowConfirmModal(true);
  }

  /* CREATE RESERVATION */
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

    console.log("Création réservation:", payload);

    try {
      const response = await fetch("http://localhost:5001/api/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 409) {
          setModalMessage("Cette salle est déjà réservée pour cette période.");
        } else {
          setModalMessage("Erreur serveur. Veuillez réessayer.");
        }
        return;
      }

      console.log("Réservation créée avec succès");

      // Fermer les modals et recharger
      setShowCreateModal(false);
      setShowConfirmModal(false);
      setSelectedEvenement(null); // Reset l'événement
      chargerReservations();

      // Effacer le message après 3 secondes
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Erreur:", error);
      setModalMessage("Erreur serveur.");
    } finally {
      setLoading(false);
    }
  }

  /* DELETE RESERVATION */
  async function handleDelete() {
    if (!selectedEvent) return;

    try {
      const res = await fetch(
        `http://localhost:5001/api/reservation/${selectedEvent.id}`,
        {
          method: "DELETE",
        },
      );

      if (!res.ok) {
        setMessage("Erreur lors de la suppression.");
        return;
      }

      console.log("Réservation supprimée");
      setShowEventModal(false);
      chargerReservations();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Erreur:", error);
      setMessage("Erreur lors de la suppression.");
    }
  }

  return (
    <div className="calendar-container">
      <h1>Réservation de salles</h1>

      {/* Messages d'information */}
      {message && <div className="message-error">{message}</div>}

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
              setMessage("");
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
            setMessage("");
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
                    className={`status ${salle.statut === "Disponible" ? "available" : "unavailable"}`}
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
                    Du{" "}
                    {new Date(newReservation.dateDebut).toLocaleString(
                      "fr-FR",
                      {
                        day: "2-digit",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                    <br />
                    au{" "}
                    {new Date(newReservation.dateFin).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
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
      {showEventModal && selectedEvent && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div
            className="modal modal-event"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{selectedEvent.title}</h2>

            <p className="event-dates">
              {" "}
              {selectedEvent.start.toLocaleString("fr-FR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
              {" → "}
              {selectedEvent.end?.toLocaleString("fr-FR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>

            <p className="event-description">
              {selectedEvent.extendedProps.description || "Aucune description"}
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
