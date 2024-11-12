import { createContext, useContext, useState } from "react";
import { TicketFormSubmit } from "../types/supabaseplain";
import { EventTicket } from "../types/supabaseplain";
import { useSupabase } from "./SupabaseProvider";
import Colors from "../constants/Colors";

type CartItem = { eventTicket: EventTicket, quantity: number, associatedTicketFormSubmit?: Partial<TicketFormSubmit> };
type Cart = CartItem[] | null;

type EventScreensContextProps = {
  cart: Cart | null;
  eventBackgroundColor: string;
  formUrl: string;
  Ds_MerchantParameters: string;
  Ds_Signature: string;
  Ds_SignatureVersion: string;
  cardNumber: string;
  expiryDate: string;
  setCart: (cart: Cart) => void;
  setEventBackgroundColor: (eventBackgroundColor: string) => void;
  setFormUrl: (formUrl: string) => void;
  setDs_MerchantParameters: (Ds_MerchantParameters: string) => void;
  setDs_Signature: (Ds_Signature: string) => void;
  setDs_SignatureVersion: (Ds_SignatureVersion: string) => void;
  setCardNumber: (cardNumber: string) => void;
  setExpiryDate: (expiryDate: string) => void;
};

type EventScreensProviderProps = {
  children: React.ReactNode;
};

export const EventScreensContext = createContext<EventScreensContextProps>({
  cart: null,
  eventBackgroundColor: null,
  formUrl: null,
  Ds_MerchantParameters: null,
  Ds_Signature: null,
  Ds_SignatureVersion: null,
  cardNumber: null,
  expiryDate: null,
  setCart: () => {},
  setEventBackgroundColor: () => {},
  setFormUrl: () => {},
  setDs_MerchantParameters: () => {},
  setDs_Signature: () => {},
  setDs_SignatureVersion: () => {},
  setCardNumber: () => {},
  setExpiryDate: () => {}
});

export const useEventScreens = () => useContext(EventScreensContext);

export const EventScreensProvider = ({ children }: EventScreensProviderProps) => {
  const { theme } = useSupabase();

  const [cart, setCart] = useState<Cart>();
  const [eventBackgroundColor, setEventBackgroundColor] = useState<string>(Colors[theme].backgroundContrast);
  const [formUrl, setFormUrl] = useState<string>(null);
  const [Ds_MerchantParameters, setDs_MerchantParameters] = useState<string>(null);
  const [Ds_Signature, setDs_Signature] = useState<string>(null);
  const [Ds_SignatureVersion, setDs_SignatureVersion] = useState<string>(null);
  const [cardNumber, setCardNumber] = useState<string>(null);
  const [expiryDate, setExpiryDate] = useState<string>(null);

  return (
    <EventScreensContext.Provider
      value={{
        cart,
        setCart,
        eventBackgroundColor,
        setEventBackgroundColor,
        formUrl,
        setFormUrl,
        Ds_MerchantParameters,
        setDs_MerchantParameters,
        Ds_Signature,
        setDs_Signature,
        Ds_SignatureVersion,
        setDs_SignatureVersion,
        cardNumber,
        setCardNumber,
        expiryDate,
        setExpiryDate
      }}
    >
      {children}
    </EventScreensContext.Provider>
  );
};