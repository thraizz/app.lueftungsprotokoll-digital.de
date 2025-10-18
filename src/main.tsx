import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeMigrations } from "./lib/migrations";
import { registerSW } from "virtual:pwa-register";

// Initialize database migrations
initializeMigrations().catch((error) => {
  console.error("Failed to initialize database migrations:", error);
});

// Register service worker
if ("serviceWorker" in navigator) {
  registerSW({
    onNeedRefresh() {
      console.log("New content available, please refresh.");
    },
    onOfflineReady() {
      console.log("App ready to work offline.");
    },
  });
}

createRoot(document.getElementById("root")!).render(<App />);
