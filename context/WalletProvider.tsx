import React, { createContext, useContext, useEffect } from "react";
import { useState } from "react";
import { Cart, Ticket, WalletTicketGroups } from "../app/types";
import { FIREBASE_AUTH, FIRESTORE_DB } from "../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "./AuthProvider";

type WalletContextType = {
  funds: number | undefined;
  setFunds: (funds: number | undefined) => void;
  cart: Cart;
  setCart: (cart: Cart) => void;
  walletTicketGroups: WalletTicketGroups;
  setWalletTicketGroups: (walletTicketGroups: WalletTicketGroups) => void;
};

const WalletContext = createContext<WalletContextType>({
  funds: undefined,
  setFunds: () => {},
  cart: null,
  setCart: () => {},
  walletTicketGroups: null,
  setWalletTicketGroups: () => {}
});

export const useWallet = () => useContext(WalletContext);

export function WalletProvider({ children }: { children: JSX.Element }): JSX.Element {
  const [funds, setFunds] = useState<number | undefined>(undefined);
  const [cart, setCart] = useState<Cart>(null);
  const [walletTicketGroups, setWalletTicketGroups] = useState<WalletTicketGroups>(null);

  const { user, setUser } = useAuth();

  // useEffect(() => {
  //   console.log('PAU LOG-> cart: ', cart);
  // }, [cart]);

  useEffect(() => {
    if (funds === undefined && user && user.walletFunds !== funds) {
      setFunds(user.walletFunds);
      setWalletTicketGroups(user.walletTicketGroups);
    }
  }, [user]);

  useEffect(() => {
    if (funds !== undefined && user && user.walletFunds !== funds) {
      const userDocRef = doc(FIRESTORE_DB, 'users', user.id);
      updateDoc(userDocRef, {
        walletFunds: funds
      }).then(() => {
        setUser({
          ...user,
          walletFunds: funds
        });
      });
    }
  }, [funds]);

  useEffect(() => {
    if (walletTicketGroups !== null && user && user.walletTicketGroups !== walletTicketGroups) {
      const userDocRef = doc(FIRESTORE_DB, 'users', user.id);
      updateDoc(userDocRef, {
        walletTicketGroups: walletTicketGroups
      }).then(() => {
        setUser({
          ...user,
          walletTicketGroups: walletTicketGroups
        });
      });
    }
  }, [walletTicketGroups]);

  const walletContext: WalletContextType = {
    funds,
    setFunds,
    cart,
    setCart,
    walletTicketGroups,
    setWalletTicketGroups
  };

  return <WalletContext.Provider value={walletContext}>{children}</WalletContext.Provider>;
}