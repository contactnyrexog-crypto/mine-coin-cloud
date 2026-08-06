import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { CURRENCIES, formatPrice, type CurrencyCode } from "./constants";

type Ctx = { currency: CurrencyCode; setCurrency: (c: CurrencyCode) => void; price: (inr: number) => string };

const CurrencyContext = createContext<Ctx>({
  currency: "INR",
  setCurrency: () => {},
  price: (inr) => formatPrice(inr, "INR"),
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("INR");

  useEffect(() => {
    const saved = localStorage.getItem("nh_currency");
    if (saved && saved in CURRENCIES) setCurrencyState(saved as CurrencyCode);
  }, []);

  const setCurrency = (c: CurrencyCode) => {
    setCurrencyState(c);
    localStorage.setItem("nh_currency", c);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, price: (inr) => formatPrice(inr, currency) }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
