import { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/dashboard.css";

export default function HistoriqueEvenements() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5001/api/historique", {
        withCredentials: true,
      })
      .then((res) => setEvents(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="page">
      <div className="pageHeader">
        <h2>Historique des événements</h2>
        <p className="muted">
          Consultez tous les événements passés et leurs informations
        </p>
      </div>

      {events.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Type</th>
              <th>Date</th>
              <th>Statut</th>
              <th>Salle</th>
              <th>Participants</th>
              <th>Budget</th>
            </tr>
          </thead>

          <tbody>
            {events.map((e) => (
              <tr key={e.id_evenement}>
                <td>{e.nom_evenement}</td>
                <td>{e.type_evenement}</td>
                <td>
                  {new Date(e.date_debut).toLocaleDateString()}
                </td>
                <td>{e.statut}</td>
                <td>{e.nom_salle}</td>
                <td>{e.nb_participants}</td>
                <td>{e.budget} $</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Aucun événement trouvé</p>
      )}
    </div>
  );
}