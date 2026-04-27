import React, { createContext, useState, useEffect } from "react";
import {
  clearAuthToken,
  pulsifyAxiosInstance,
  readAuthToken,
  saveAuthToken,
} from "../services/api";

export const PulsifyAuthVaultContext = createContext();

const isMockMode =
  String(
    import.meta.env.VITE_USE_MOCKS ??
      import.meta.env.VITE_USE_MOCK_API ??
      import.meta.env.VITE_USE_MOCK ??
      "false",
  ).toLowerCase() === "true";

export const PulsifyAuthVaultProvider = ({ children }) => {
  const [activeSessionToken, setActiveSessionToken] = useState(
    readAuthToken() || null,
  );
  const [subscriptionTier, setSubscriptionTier] = useState(
    localStorage.getItem("pulsify_mock_tier") || "FREE",
  );

  useEffect(() => {
    let isMounted = true;
    const verifyPremiumStatus = async () => {
      if (!activeSessionToken) return;
      if (isMockMode) {
        // In mock mode, read from localStorage (set by the Premium page mock checkout)
        const savedTier = localStorage.getItem("pulsify_mock_tier");
        if (isMounted && savedTier) setSubscriptionTier(savedTier);
        return;
      }
      try {
        const { data } = await pulsifyAxiosInstance.get("/subscriptions/me");
        if (isMounted && data.tier) {
          setSubscriptionTier(data.tier);
        }
      } catch (err) {
        if (err?.response?.status === 401) {
          clearAuthToken();
          if (isMounted) setActiveSessionToken(null);
        }
        if (isMounted) setSubscriptionTier("FREE");
      }
    };
    verifyPremiumStatus();
    return () => {
      isMounted = false;
    };
  }, [activeSessionToken]);

  const handleTierChange = (newTier) => {
    setSubscriptionTier(newTier);
    if (isMockMode) {
      localStorage.setItem("pulsify_mock_tier", newTier);
    }
  };

  const mountSecureSession = (token) => {
    saveAuthToken(token);
    setActiveSessionToken(token);
  };

  const destroySecureSession = () => {
    clearAuthToken();
    localStorage.removeItem("pulsify_refresh_token");
    localStorage.removeItem("pulsify_mock_tier");
    localStorage.removeItem("pulsify_user");
    setActiveSessionToken(null);
    setSubscriptionTier("FREE");
  };

  return (
    <PulsifyAuthVaultContext.Provider
      value={{
        activeSessionToken,
        subscriptionTier,
        setSubscriptionTierOverride: handleTierChange,
        mountSecureSession,
        destroySecureSession,
      }}
    >
      {children}
    </PulsifyAuthVaultContext.Provider>
  );
};
