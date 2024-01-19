import { useState } from "react";
import React, { createContext, useContext, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { FIRESTORE_DB } from "../firebaseConfig";
import { Cart, WalletTicketGroups } from "../types";
import { useAuth } from "./AuthProvider";

type WalletContextType = {
  cart: Cart;
  setCart: (cart: Cart) => void;
  walletTicketGroups: WalletTicketGroups;
  setWalletTicketGroups: (walletTicketGroups: WalletTicketGroups) => void;
};

const WalletContext = createContext<WalletContextType>({
  cart: null,
  setCart: () => {},
  walletTicketGroups: null,
  setWalletTicketGroups: () => {}
});

export const useWallet = () => useContext(WalletContext);

export function WalletProvider({ children }: { children: JSX.Element }): JSX.Element {
  const [cart, setCart] = useState<Cart>(null);
  const [walletTicketGroups, setWalletTicketGroups] = useState<WalletTicketGroups>(null);

  const { user, setUser } = useAuth();

  useEffect(() => {
    if (!user) {
      setCart(null);
      setWalletTicketGroups(null);
      return;
    }
    if (user.walletTicketGroups) {
      setWalletTicketGroups(user.walletTicketGroups);
    } else {
      setWalletTicketGroups(null);
    }
  }, [user]);

  useEffect(() => {
    if (walletTicketGroups && user && user.walletTicketGroups !== walletTicketGroups) {
      const userDocRef = doc(FIRESTORE_DB, 'users', user.id);
      updateDoc(userDocRef, {
        walletTicketGroups: walletTicketGroups
      }).then(() => {
        setUser({ //TODO PAU doesnt this cause an unnecessary kinda loop? like calling useEffent above which triggers this useEffect which triggers the useEffect, which wont continue becuase user.walletTicketGroups === walletTicketGroups, but still, it's a bit weird
          ...user,
          walletTicketGroups: walletTicketGroups
        });
      });
    }
  }, [walletTicketGroups]);

  const walletContext: WalletContextType = {
    cart,
    setCart,
    walletTicketGroups,
    setWalletTicketGroups
  };

  return <WalletContext.Provider value={walletContext}>{children}</WalletContext.Provider>;
}