import { createContext, useContext, useState } from "react";
import { TicketFormSubmit } from "../types/supabaseplain";
import { EventTicket, Event } from "../types/supabaseplain";
import { useSupabase } from "./SupabaseProvider";
import Colors from "../constants/Colors";
import { supabase } from "../supabase";
import { router } from "expo-router";

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
  eventTicketsWithLimit: EventTicket[];
  loading: boolean;
  event: Event;
  storeCreditCardChecked: boolean;
  orderConfirmed: boolean;
  setCart: (cart: Cart) => void;
  setEventBackgroundColor: (eventBackgroundColor: string) => void;
  setCardNumber: (cardNumber: string) => void;
  setExpiryDate: (expiryDate: string) => void;
  setEventTicketsWithLimit: (eventTicketsWithLimit: EventTicket[]) => void;
  buyCartProcess: () => void;
  setEvent: (event: Event) => void;
  setStoreCreditCardChecked: (storeCreditCardChecked: boolean) => void;
  setOrderConfirmed: (orderConfirmed: boolean) => void;
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
  eventTicketsWithLimit: [],
  loading: false,
  event: null,
  storeCreditCardChecked: false,
  orderConfirmed: false,
  setCart: () => {},
  setEventBackgroundColor: () => {},
  setCardNumber: () => {},
  setExpiryDate: () => {},
  setEventTicketsWithLimit: () => {},
  buyCartProcess: () => {},
  setEvent: () => {},
  setStoreCreditCardChecked: () => {},
  setOrderConfirmed: () => {}
});

export const useEventScreens = () => useContext(EventScreensContext);

export const EventScreensProvider = ({ children }: EventScreensProviderProps) => {
  const { theme, session } = useSupabase();

  const [cart, setCart] = useState<Cart>();
  const [eventBackgroundColor, setEventBackgroundColor] = useState<string>(Colors[theme].backgroundContrast);
  const [formUrl, setFormUrl] = useState<string>(null);
  const [Ds_MerchantParameters, setDs_MerchantParameters] = useState<string>(null);
  const [Ds_Signature, setDs_Signature] = useState<string>(null);
  const [Ds_SignatureVersion, setDs_SignatureVersion] = useState<string>(null);
  const [cardNumber, setCardNumber] = useState<string>(null);
  const [expiryDate, setExpiryDate] = useState<string>(null);
  const [eventTicketsWithLimit, setEventTicketsWithLimit] = useState<EventTicket[]>([]);
  const [event, setEvent] = useState<Event>();
  const [storeCreditCardChecked, setStoreCreditCardChecked] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  const [loading, setLoading] = useState<boolean>(false);

  const buyCartProcess = () => {
    if (loading) {
      return;
    }
    setLoading(true);

    if (eventTicketsWithLimit?.length) {
      checkForLimitedTickets();
    } else {
      getPaymentFormInfo();
    }
  };

  const checkForLimitedTickets = async () => {
    try {
      const results = await Promise.all(eventTicketsWithLimit.map(async (ticket) => {
        const cartItem = cart.find((item) => item.eventTicket.id === ticket.id);
        const { data: count, error } = await supabase.rpc('count_wallet_tickets_by_event_tickets_id', { p_event_tickets_id: ticket.id });
        
        return !(error || count > ticket.wallet_tickets_limit || count + cartItem.quantity > ticket.wallet_tickets_limit);
      }));
  
      if (results.every(Boolean)) {
        getPaymentFormInfo();
      } else {
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
    }
  };

  const getPaymentFormInfo = () => {
    fetch(process.env.EXPO_PUBLIC_FIREBASE_FUNC_GET_FORM_INFO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + session.access_token
      },
      body: JSON.stringify({
        eventId: event.id,
        requestToken: storeCreditCardChecked,
        cart: cart
      })
    })
    .then((response) => {
      if (!response.ok) {
        throw response;
      }
      return response.json();
    })
    .then((data) => {
      if (!data) {
        return;
      }
      if (data.zeroAmount) {
        setTimeout(() => {
          setLoading(false);
          setOrderConfirmed(true); //TODO PAU ideally this should be set to true after payment is confirmed. this will require listening for new redsys_orders docs with the orderId and checking the status field
          setCart(null);
        }, 700);
        return;
      }

      setFormUrl(data.formUrl.replace(/\//g, '%2F'));
      setDs_MerchantParameters(data.Ds_MerchantParameters.replace(/\//g, '%2F'));
      setDs_Signature(data.Ds_Signature.replace(/\//g, '%2F'));
      setDs_SignatureVersion(data.Ds_SignatureVersion.replace(/\//g, '%2F'));

      setTimeout(() => {
        setLoading(false);
        setOrderConfirmed(true); //TODO PAU ideally this should be set to true after payment is confirmed. this will require listening for new redsys_orders docs with the orderId and checking the status field
        setCart(null);
      }, 3000);

      router.navigate('/event/paymentModal');
    })
    .catch(() => {
      setLoading(false);
      setCart(null);
      router.navigate(`/event/${event.id}`);
    });
  }

  return (
    <EventScreensContext.Provider
      value={{
        cart,
        setCart,
        eventBackgroundColor,
        setEventBackgroundColor,
        formUrl,
        Ds_MerchantParameters,
        Ds_Signature,
        Ds_SignatureVersion,
        cardNumber,
        setCardNumber,
        expiryDate,
        setExpiryDate,
        eventTicketsWithLimit,
        setEventTicketsWithLimit,
        loading,
        event,
        setEvent,
        storeCreditCardChecked,
        setStoreCreditCardChecked,
        orderConfirmed,
        setOrderConfirmed,
        buyCartProcess
      }}
    >
      {children}
    </EventScreensContext.Provider>
  );
};