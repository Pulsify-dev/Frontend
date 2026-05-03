import React, { createContext, useState, useEffect, useCallback } from "react";
import {
  pulsifyAxiosInstance,
  readAuthToken,
  saveAuthToken,
  clearAuthToken,
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
      const subscription = responseData?.subscription;
      if (plan) {
        // If cancel_at_period_end is true, the user cancelled but backend
        // still reports "Artist Pro" until the period ends.
        // For UI purposes, treat them as FREE immediately.
        const isCancelled = subscription?.cancel_at_period_end === true ||
                            subscription?.status === "Cancelled";
        const tier = (plan === "Artist Pro" && !isCancelled) ? "PRO" : "FREE";
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
