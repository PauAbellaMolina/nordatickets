import React, { createContext, useContext, useEffect } from "react";
import { useState } from "react";
import { Cart, Ticket, WalletTickets } from "../app/types";

type WalletContextType = {
  funds: number | null;
  setFunds: (funds: number | null) => void;
  cart: Cart;
  setCart: (cart: Cart) => void;
  walletTickets: WalletTickets;
  setWalletTickets: (walletTickets: WalletTickets) => void;
};

const WalletContext = createContext<WalletContextType>({
  funds: null,
  setFunds: () => {},
  cart: null,
  setCart: () => {},
  walletTickets: null,
  setWalletTickets: () => {}
});

export const useWallet = () => useContext(WalletContext);

export function WalletProvider({ children }: { children: JSX.Element }): JSX.Element {
  const [funds, setFunds] = useState<number | null>(0);
  const [cart, setCart] = useState<Cart>(null);
  const [walletTickets, setWalletTickets] = useState<WalletTickets>(null);

  // useEffect(() => {
  //   console.log('PAU LOG-> cart: ', cart);
  // }, [cart]);

  const walletContext: WalletContextType = {
    funds,
    setFunds,
    cart,
    setCart,
    walletTickets,
    setWalletTickets
  };

  return <WalletContext.Provider value={walletContext}>{children}</WalletContext.Provider>;
}