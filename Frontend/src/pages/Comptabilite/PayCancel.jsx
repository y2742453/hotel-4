// ComptabiliteCancel.jsx
export default function ComptabiliteCancel() {
  return (
    <div className="page">
      <h1>Paiement annulé</h1>
      <p>Le paiement a été annulé.</p>

      <a href="/comptabilite/factures" className="btn btnGhost">
        Retour aux factures
      </a>
    </div>
  );
}
