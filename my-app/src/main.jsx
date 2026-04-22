import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { PulsifyAuthVaultProvider } from "./store/PulsifyAuthVault.jsx";
import { AuthProvider } from "@/contexts/AuthContext";
import "./index.css";
import "./css/navbar-soundcloud.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <PulsifyAuthVaultProvider>
      <BrowserRouter
        future={{
          v7_relativeSplatPath: true,
          v7_startTransition: true,
        }}
      >
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </PulsifyAuthVaultProvider>
  </StrictMode>
);