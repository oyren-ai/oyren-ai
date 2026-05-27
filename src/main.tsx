import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Hide splash screen after animation completes (~3.2s)
setTimeout(() => {
  const splash = document.getElementById("splash-screen");
  if (splash) {
    splash.classList.add("hidden");
    // Remove from DOM after fade-out transition completes
    setTimeout(() => splash.remove(), 500);
  }
}, 3200);
