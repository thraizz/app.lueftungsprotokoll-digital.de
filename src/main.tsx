import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeMigrations } from "./lib/migrations";
import { registerSW } from "virtual:pwa-register";

// Initialize the app asynchronously
async function initializeApp() {
  try {
    // Initialize database migrations first
    await initializeMigrations();
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database migrations:", error);
    // Continue anyway to allow the app to render and show an error message
  }

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

  // Render the app after database is ready
  createRoot(document.getElementById("root")!).render(<App />);
}

// Start the app
initializeApp();
