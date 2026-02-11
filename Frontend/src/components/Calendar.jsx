import { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import frLocale from "@fullcalendar/core/locales/fr";
import "../Calendar.css";

const Calendar = () => {
  const calendarRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [salles, setSalles] = useState([]);
  const [evenements, setEvenements] = useState([]);
  const [selectedSalle, setSelectedSalle] = useState(null);
  const [selectedEvenement, setSelectedEvenement] = useState(null);

  const [selectedEvent, setSelectedEvent] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [newReservation, setNewReservation] = useState({
    nomEvenement: "",
    dateDebut: "",
    dateFin: "",
  });

  const initialView = window.innerWidth <= 768 ? "timeGridDay" : "timeGridWeek";

  useEffect(() => {
    chargerSalles();
  }, []);

  useEffect(() => {
    chargerEvenements();
  }, []);

  useEffect(() => {
    if (selectedSalle) {
      chargerReservations();
    }
  }, [selectedSalle]);

  async function chargerSalles() {
    try {
      const res = await fetch("http://localhost:3001/api/salles");
      const data = await res.json();
      setSalles(data);
      if (data.length > 0) setSelectedSalle(data[0].id_salle);
    } catch {
      setMessage("Erreur lors du chargement des salles.");
    }
  }

  async function chargerEvenements() {
    try {
      const res = await fetch("http://localhost:3001/api/evenements");
      const data = await res.json();
      setEvenements(data);
      if (data.length > 0) setSelectedEvenement(data[0].id_evenement);
    } catch {
      setMessage("Erreur lors du chargement des événements.");
    }
  }

  async function chargerReservations() {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(
        `http://localhost:3001/api/reservation/salle/${selectedSalle}`,
      );
      const reservations = await res.json();

      setEvents(
        reservations.map((r) => ({
          id: r.id_reservation,
          title: r.nom_evenement,
          start: r.date_debut,
          end: r.date_fin,
        })),
      );
    } catch {
      setMessage("Erreur lors du chargement des réservations.");
    } finally {
      setLoading(false);
    }
  }

  /* CALENDAR HANDLERS */
  const handleEventClick = (info) => {
    setSelectedEvent(info.event);
    setShowEventModal(true);
  };

  const handleSelectSlot = (info) => {
    const format = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate(),
      ).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(
        d.getMinutes(),
      ).padStart(2, "0")}`;

    setNewReservation({
      nomEvenement: "",
      dateDebut: format(info.start),
      dateFin: format(info.end),
    });

    setShowCreateModal(true);
    calendarRef.current.getApi().unselect();
  };

  /* CREATE RESERVATION */
  async function creerReservation(e) {
    e.preventDefault();
    setMessage("");

    const payload = {
      idSalle: selectedSalle,
      idEvenement: selectedEvenement,
      dateDebut: newReservation.dateDebut.replace("T", " ") + ":00",
      dateFin: newReservation.dateFin.replace("T", " ") + ":00",
    };

    try {
      const response = await fetch("http://localhost:3001/api/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setMessage("Conflit ou erreur lors de la réservation.");
        return;
      }

      setShowCreateModal(false);
      chargerReservations();
    } catch (error) {
      console.error(error); // logs the real error
      setMessage("Erreur serveur.");
    }
  }

  /* DELETE RESERVATION */
  async function handleDelete() {
    if (!selectedEvent) return;

    try {
      await fetch(`http://localhost:3001/api/reservation/${selectedEvent.id}`, {
        method: "DELETE",
      });

      selectedEvent.remove();
      setShowEventModal(false);
    } catch {
      setMessage("Erreur lors de la suppression.");
    }
  }

  return (
    <div className="calendar-container">
      <h1>Réservation de salles</h1>

      <div className="salle-selector">
        <label>Salle:</label>
        <select
          value={selectedSalle || ""}
          onChange={(e) => setSelectedSalle(Number(e.target.value))}
        >
          {salles.map((s) => (
            <option key={s.id_salle} value={s.id_salle}>
              {s.nom_salle} — Capacité {s.capacite}
            </option>
          ))}
        </select>
      </div>

      {message && <div className="message-error">{message}</div>}

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
        selectable
        select={handleSelectSlot}
        eventClick={handleEventClick}
        events={events}
        slotMinTime="07:00:00"
        slotMaxTime="22:00:00"
        allDaySlot={false}
        height="auto"
      />

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nouvelle réservation</h2>
            <form onSubmit={creerReservation}>
              <select
                value={selectedEvenement || ""}
                onChange={(e) => setSelectedEvenement(Number(e.target.value))}
                required
              >
                {evenements.map((ev) => (
                  <option key={ev.id_evenement} value={ev.id_evenement}>
                    {ev.nom_evenement}
                  </option>
                ))}
              </select>
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
              <div className="modal-buttons">
                <button type="button" onClick={() => setShowCreateModal(false)}>
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!selectedSalle || !selectedEvenement}
                >
                  Créer
                </button>
              </div>
            </form>
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
            <p>
              {selectedEvent.start.toLocaleString("fr-FR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
              <br />↓<br />{" "}
              {selectedEvent.end?.toLocaleString("fr-FR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>

            <div className="modal-buttons">
              <button onClick={() => setShowEventModal(false)}>Fermer</button>
              <button className="delete" onClick={handleDelete}>
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
