import React, { createContext, useState, useEffect } from "react";
import { pulsifyAxiosInstance } from "../services/api";

export const PulsifyAuthVaultContext = createContext();

export const PulsifyAuthVaultProvider = ({ children }) => {
  const [activeSessionToken, setActiveSessionToken] = useState(
    localStorage.getItem("pulsify_jwt_token") ||
      localStorage.getItem("pulsify_jwt_token") ||
      null,
  );
  const [subscriptionTier, setSubscriptionTier] = useState(
    localStorage.getItem("pulsify_mock_tier") || "FREE",
  );

  useEffect(() => {
    let isMounted = true;
    const verifyPremiumStatus = async () => {
      if (!activeSessionToken) return;
      if (String(import.meta.env.VITE_USE_MOCKS) === "true") {
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
    if (String(import.meta.env.VITE_USE_MOCKS) === "true") {
      localStorage.setItem("pulsify_mock_tier", newTier);
    }
  };

  const mountSecureSession = (token) => {
    localStorage.setItem("pulsify_jwt_token", token);
    setActiveSessionToken(token);
  };

  const destroySecureSession = () => {
    localStorage.removeItem("pulsify_jwt_token");
    localStorage.removeItem("pulsify_mock_tier");
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
