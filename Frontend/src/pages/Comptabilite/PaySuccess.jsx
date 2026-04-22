import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ComptabiliteSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/comptabilite/factures");
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="page">
      <h1>Paiement réussi</h1>
      <p>Redirection en cours...</p>
    </div>
  );
}
