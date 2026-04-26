import React, { createContext, useState, useEffect, useCallback } from "react";
import { pulsifyAxiosInstance } from "../services/api";

export const PulsifyAuthVaultContext = createContext();

export const PulsifyAuthVaultProvider = ({ children }) => {
  const [activeSessionToken, setActiveSessionToken] = useState(
    localStorage.getItem("pulsify_access_token") || null,
  );
  const [subscriptionTier, setSubscriptionTier] = useState(
    localStorage.getItem("pulsify_mock_tier") || "FREE",
  );
  const [planLimits, setPlanLimits] = useState(null);

  const verifyPremiumStatus = useCallback(async () => {
    if (!activeSessionToken) return;
    if (String(import.meta.env.VITE_USE_MOCKS) === "true") {
      // In mock mode, read from localStorage (set by the Premium page mock checkout)
      const savedTier = localStorage.getItem("pulsify_mock_tier");
      if (savedTier) setSubscriptionTier(savedTier);
      return;
    }
    try {
      const { data } = await pulsifyAxiosInstance.get("/subscriptions/me");
      // Backend returns { success, data: { subscription, effective_plan, plan_limits } }
      const responseData = data?.data || data;
      const plan = responseData?.effective_plan;
      if (plan) {
        const tier = plan === 'Artist Pro' ? 'PRO' : 'FREE';
        setSubscriptionTier(tier);
        if (responseData?.plan_limits) {
          setPlanLimits(responseData.plan_limits);
        }
      }
    } catch (err) {
      setSubscriptionTier("FREE");
    }
  }, [activeSessionToken]);

  useEffect(() => {
    verifyPremiumStatus();
  }, [verifyPremiumStatus]);

  const handleTierChange = (newTier) => {
    setSubscriptionTier(newTier);
    if (String(import.meta.env.VITE_USE_MOCKS) === "true") {
      localStorage.setItem("pulsify_mock_tier", newTier);
    }
  };

  const mountSecureSession = (token) => {
    localStorage.setItem("pulsify_access_token", token);
    setActiveSessionToken(token);
  };

  const destroySecureSession = () => {
    localStorage.removeItem("pulsify_access_token");
    localStorage.removeItem("pulsify_refresh_token");
    localStorage.removeItem("pulsify_mock_tier");
    localStorage.removeItem("pulsify_user");
    setActiveSessionToken(null);
    setSubscriptionTier("FREE");
    setPlanLimits(null);
  };

  return (
    <PulsifyAuthVaultContext.Provider
      value={{
        activeSessionToken,
        subscriptionTier,
        planLimits,
        setSubscriptionTierOverride: handleTierChange,
        refreshSubscription: verifyPremiumStatus,
        mountSecureSession,
        destroySecureSession,
      }}
    >
      {children}
    </PulsifyAuthVaultContext.Provider>
  );
};
