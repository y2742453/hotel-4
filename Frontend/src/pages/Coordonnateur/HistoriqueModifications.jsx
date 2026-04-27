import { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/dashboard.css";

export default function HistoriqueModifications() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [logs, setLogs] = useState([]);

  // 🔥 Charger la liste des événements
  useEffect(() => {
    axios
      .get("https://hotel-4.up.railway.app/api/historique", {
        withCredentials: true,
      })
      .then((res) => setEvents(res.data))
      .catch((err) => console.error(err));
  }, []);

  // 🔥 Charger l'historique quand on choisit un événement
  useEffect(() => {
    if (!selectedEvent) return;

    axios
      .get(
        `https://hotel-4.up.railway.app/api/evenements/${selectedEvent}/historique`,
        {
          withCredentials: true,
        },
      )
      .then((res) => setLogs(res.data))
      .catch((err) => console.error(err));
  }, [selectedEvent]);

  return (
    <div className="page">
      <div className="pageHeader">
        <h2> Historique des modifications</h2>
        <p className="muted">
          Consultez les changements effectués sur les événements
        </p>
      </div>

      {/* 🔽 SELECT EVENT */}
      <div style={{ marginBottom: "20px" }}>
        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
        >
          <option value="">-- Choisir un événement --</option>
          {events.map((e) => (
            <option key={e.id_evenement} value={e.id_evenement}>
              {e.nom_evenement}
            </option>
          ))}
        </select>
      </div>

      {/* 🔥 TABLE */}
      {selectedEvent && logs.length > 0 ? (
        <div className="tableWrapper">
          <table>
            <thead>
              <tr>
                <th>Champ</th>
                <th>Ancienne valeur</th>
                <th>Nouvelle valeur</th>
                <th>Date</th>
                <th>Utilisateur</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.champ_modifie}</td>
                  <td style={{ color: "red" }}>{log.ancienne_valeur}</td>
                  <td style={{ color: "green" }}>{log.nouvelle_valeur}</td>
                  <td>{new Date(log.date_modification).toLocaleString()}</td>
                  <td>
                    {log.nom} {log.prenom}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : selectedEvent ? (
        <p>Aucune modification pour cet événement</p>
      ) : null}
    </div>
  );
}

{
  /* 🔥 ACTIONS */
}
<div style={{ marginTop: "30px" }}>
  <h3 style={{ marginBottom: "15px" }}>Actions rapides</h3>

  <div className="dashGrid">
    <button
      className="dashCard"
      onClick={() => (window.location.href = "/coordonnateur/audit")}
    >
      <div className="dashText">
        <div className="dashTitle">Audit</div>
        <div className="dashDesc">Historique des modifications</div>
      </div>

      <div className="dashBadge">Ouvrir</div>
    </button>
  </div>
</div>;
