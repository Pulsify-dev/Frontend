import React, { createContext, useState } from 'react';

export const PulsifyAuthVaultContext = createContext();

export const PulsifyAuthVaultProvider = ({ children }) => {
  const [activeSessionToken, setActiveSessionToken] = useState(localStorage.getItem('pulsify_jwt_token') || null);
  const [isPulsifyPremiumActive, setIsPulsifyPremiumActive] = useState(false);

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
        setIsPulsifyPremiumActive,
        mountSecureSession,
        destroySecureSession,
      }}
    >
      {children}
    </PulsifyAuthVaultContext.Provider>
  );
};
