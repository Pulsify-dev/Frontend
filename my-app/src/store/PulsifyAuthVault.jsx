import React, { createContext, useState, useEffect } from 'react';
import { pulsifyAxiosInstance } from '../services/api';

export const PulsifyAuthVaultContext = createContext();

export const PulsifyAuthVaultProvider = ({ children }) => {
  const [activeSessionToken, setActiveSessionToken] = useState(localStorage.getItem('pulsify_jwt_token') || null);
  const [isPulsifyPremiumActive, setIsPulsifyPremiumActive] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const verifyPremiumStatus = async () => {
      if (!activeSessionToken) return;
      if (String(import.meta.env.VITE_USE_MOCKS) === 'true') {
        if (isMounted) setIsPulsifyPremiumActive(false);
        return;
      }
      try {
        const { data } = await pulsifyAxiosInstance.get('/subscriptions/me');
        if (isMounted && data.is_premium) {
          setIsPulsifyPremiumActive(true);
        }
      } catch (err) {
        if (isMounted) setIsPulsifyPremiumActive(false);
      }
    };
    verifyPremiumStatus();
    return () => { isMounted = false; };
  }, [activeSessionToken]);

  const mountSecureSession = (token) => {
    localStorage.setItem('pulsify_jwt_token', token);
    setActiveSessionToken(token);
  };

  const destroySecureSession = () => {
    localStorage.removeItem('pulsify_jwt_token');
    setActiveSessionToken(null);
    setIsPulsifyPremiumActive(false);
  };

  return (
    <PulsifyAuthVaultContext.Provider
      value={{
        activeSessionToken,
        isPulsifyPremiumActive,
        mountSecureSession,
        destroySecureSession,
      }}
    >
      {children}
    </PulsifyAuthVaultContext.Provider>
  );
};
