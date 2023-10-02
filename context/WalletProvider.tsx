import React, { createContext, useContext } from "react";
import { useState } from "react";

type WalletType = {
  funds: number | null;
  setFunds: (funds: number | null) => void;
}

const WalletContext = createContext<WalletType>({
  funds: null,
  setFunds: () => {},
});

export const useFunds= () => useContext(WalletContext);

export function WalletProvider({ children }: { children: JSX.Element }): JSX.Element {
  const [funds, setFunds] = useState<number | null>(0);

  // useEffect(() => {

  // }), []);

  const walletContext: WalletType = {
    funds,
    setFunds
  };

return <WalletContext.Provider value={walletContext}>{children}</WalletContext.Provider>;
}