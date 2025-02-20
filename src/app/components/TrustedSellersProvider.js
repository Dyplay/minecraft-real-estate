"use client";

import { createContext, useContext } from "react";

// ✅ Create the context
export const TrustedSellersContext = createContext();

// ✅ List of verified sellers (UUIDs)
const verifiedSellers = [
  "119c2cd733a74c7da9611336e3188271",
];

// ✅ Context Provider Component
export default function TrustedSellersProvider({ children }) {
  return (
    <TrustedSellersContext.Provider value={verifiedSellers}>
      {children}
    </TrustedSellersContext.Provider>
  );
}

// ✅ Hook for easy access to context
export function useTrustedSellers() {
  return useContext(TrustedSellersContext);
}