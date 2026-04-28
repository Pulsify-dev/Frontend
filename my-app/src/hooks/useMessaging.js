import { useContext } from "react";
import { MessagingContext } from "@/context/messagingContextValue";

export const useMessaging = () => {
  const context = useContext(MessagingContext);

  if (!context) {
    throw new Error("useMessaging must be used inside a MessagingProvider block");
  }

  return context;
};
