import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../../Api/Client.jsx";
import { useToast } from "../../Components/Toast.jsx";
import "../../styles/table.css";
import "../../styles/forms.css";


export default function EvenementServices() {
  const { id_evenement } = useParams();

  const [services, setServices] = useState([]);
  const [idService, setIdService] = useState("");
  const [quantite, setQuantite] = useState(1);
  const [montantEstime, setMontantEstime] = useState(0);
  const [detailsText, setDetailsText] = useState("");
  const [demandes, setDemandes] = useState([]);
  const [message, setMessage] = useState("");

  //  Charger les services depuis la DB
  async function chargerServices() {
    const { res, data } = await apiFetch("/api/services");

    if (res.ok) {
      setServices(data);
      if (data.length > 0) {
        setIdService(data[0].id_service);
      }
    }
  }

  // Charger les demandes
  async function chargerDemandes() {
    const { res, data } = await apiFetch(
      `/api/evenementservices/evenement/${id_evenement}`
    );

    if (res.ok) {
      setDemandes(data);
    }
  }

  useEffect(() => {
    chargerServices();
    chargerDemandes();
  }, [id_evenement]);

  // 🔹 Création demande
  async function handleSubmit(e) {
    e.preventDefault();

    let parsedDetails = {};

    try {
      parsedDetails = detailsText ? JSON.parse(detailsText) : {};
    } catch {
      setMessage("JSON invalide");
      return;
    }

    const { res, data } = await apiFetch("/api/evenementservices", {
      method: "POST",
      body: JSON.stringify({
        id_evenement,
        id_service: idService,
        details: parsedDetails,
        quantite,
        montant_estime: montantEstime,
      }),
    });

    if (!res.ok) {
      setMessage(data?.message || "Erreur");
      return;
    }

    setMessage("Demande créée");
    setDetailsText("");
    chargerDemandes();
  }

  return (
    <div className="page-container">
      <h2>Services événement #{id_evenement}</h2>

      <form onSubmit={handleSubmit}>
        <select value={idService} onChange={(e) => setIdService(e.target.value)}>
          {services.map((s) => (
            <option key={s.id_service} value={s.id_service}>
              {s.nom_service}
            </option>
          ))}
        </select>

        <input
          type="number"
          value={quantite}
          onChange={(e) => setQuantite(e.target.value)}
        />

        <input
          type="number"
          value={montantEstime}
          onChange={(e) => setMontantEstime(e.target.value)}
        />

        <textarea
          value={detailsText}
          onChange={(e) => setDetailsText(e.target.value)}
        />

        <button type="submit">Ajouter</button>
      </form>

      <h3>Demandes</h3>

      {demandes.map((d) => (
        <div key={`${d.id_evenement}-${d.id_service}`}>
          {d.nom_service} - {d.statut}
        </div>
      ))}

      {message && <p>{message}</p>}
    </div>
  );
}