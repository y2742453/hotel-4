// src/Components/Toast.jsx
import React from "react";
import "../styles/forms.css";

/**
 * Toast très simple :
 * - type: 'success' ou 'error'
 * - text: message
 */
export default function Toast({ type = "success", text = "", onClose }) {
  if (!text) return null;

  return (
    <div className={type === "error" ? "msg msgError" : "msg msgSuccess"}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <span>{text}</span>
        <button className="btn btnGhost" onClick={onClose} style={{ padding: "2px 8px" }}>
          ✕
        </button>
      </div>
    </div>
  );
}
