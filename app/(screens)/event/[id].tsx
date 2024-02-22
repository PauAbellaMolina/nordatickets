import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, useColorScheme } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from '../../../components/Themed';
import EventTicketCardComponent from '../../../components/EventTicketCardComponent';
import Colors from '../../../constants/Colors';
import { FeatherIcon } from '../../../components/CustomIcons';
import GoBackArrow from '../../../components/GoBackArrow';
import { supabase } from "../../../supabase";
import { Event, WalletTicket, EventTicket } from '../../../types/supabaseplain';
import { useSupabase } from '../../../context/SupabaseProvider';

type Cart = { eventTicket: EventTicket, quantity: number }[] | null;

export default function EventDetailScreen() {
  const theme = useColorScheme() ?? 'light';
  const { id } = useLocalSearchParams();
  const { user, session } = useSupabase();
  const [cardNumber, setCardNumber] = useState<string>();
  const [redsysToken, setRedsysToken] = useState<string>();
  const [eventBackgroundColor, setEventBackgroundColor] = useState<string>(Colors[theme].backgroundContrast);
  const [eventBackgroundColorIndex, setEventBackgroundColorIndex] = useState<number>(0);
  const [event, setEvent] = useState<Event>();
  const [eventTickets, setEventTickets] = useState<EventTicket[]>();
  const [cart, setCart] = useState<Cart>();
  const [cartTotalPrice, setCartTotalPrice] = useState<number>(0);
  const [cartTotalQuantity, setCartTotalQuantity] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [lastBuyAttempt, setLastBuyAttempt] = useState<Date | null>(null);

  const chooseRandomColor = (): string => {
    const colors = Colors.eventBackgroundColorsArray[theme]
    const randomIndex = Math.floor(Math.random() * colors.length);
    setEventBackgroundColorIndex(randomIndex);
    return colors[randomIndex];
  };

  useEffect(() => {
    setEventBackgroundColor(chooseRandomColor);

    supabase.from('events').select().eq('id', id as string)
    .then(({ data: events, error }) => {
      if (error || !events.length) return;
      setEvent(events[0]);
    });

    return () => setCart(null);
  }, []);

  useEffect(() => {
    supabase.from('event_tickets').select().eq('event_id', id as string)
    .then(({ data: event_tickets, error }) => {
      if (error || !event_tickets.length) return;
      setEventTickets(event_tickets);
    });
  }, [event]);

  useEffect(() => {
    if (!user) return;
    supabase.from('users').select().eq('id', user?.id)
    .then(({ data: users, error }) => {
      if (error || !users.length) return;
      setCardNumber(users[0].card_number);
      setRedsysToken(users[0].redsys_token);
    });
  }, [user]);

  // useEffect(() => { //PAU info this adds event to user's event following list. Idea is to make a qr to go to this page (event/id) and that will add it to user's event list. Latest Info: Deep linking on web should work for this feature to be implemented.
  //   if (!event || !user || user.eventIdsFollowing.includes(id as string)) {
  //     return;
  //   }
  //   const userDocRef = doc(FIRESTORE_DB, 'users', user.id);
  //   updateDoc(userDocRef, {
  //     eventIdsFollowing: [...user.eventIdsFollowing, id]
  //   }).then(() => {
  //     setUser({
  //       ...user,
  //       eventIdsFollowing: [...user.eventIdsFollowing, id as string]
  //     });
  //   });
  // }, [event]);

  useEffect(() => {
    if (!cart) {
      setCartTotalPrice(0);
      setCartTotalQuantity(0);
      return;
    }
    const totalPrice = cart.reduce((acc, cartItem) => acc + cartItem.eventTicket.price * cartItem.quantity, 0);
    setCartTotalPrice(totalPrice);
    const totalQuantity = cart.reduce((acc, cartItem) => acc + cartItem.quantity, 0);
    setCartTotalQuantity(totalQuantity);
  }, [cart]);

  const onAddTicketHandler = (ticket: EventTicket) => {
    if (!cart) {
      setCart([{eventTicket: ticket, quantity: 1}]);
      return;
    }
    const existingCartItem = cart.find((cartItem) => cartItem.eventTicket.id === ticket.id);
    if (existingCartItem) {
      existingCartItem.quantity++;
      setCart([...cart]);
    } else {
      setCart([...cart, {eventTicket: ticket, quantity: 1}]);
    }
  };
  const onRemoveTicketHandler = (ticket: EventTicket) => {
    if (!cart) {
      return;
    }
    const existingCartItem = cart.find((cartItem) => cartItem.eventTicket.id === ticket.id);
    if (!existingCartItem) {
      return;
    }
    existingCartItem.quantity--;
    if (existingCartItem.quantity === 0) {
      const newCart = cart.filter((cartTicket) => cartTicket.eventTicket.id !== ticket.id);
      setCart(newCart);
    } else {
      setCart([...cart]);
    }
  };
  
  const onBuyCart = () => {
    if (loading || lastBuyAttempt && (new Date().getTime() - lastBuyAttempt.getTime()) < 20000) { //PAU info 20 seconds between buy attempts
      return;
    }
    setLoading(true);
    setLastBuyAttempt(new Date());
    getPaymentFormInfo();
    setTimeout(() => {
      setOrderConfirmed(true); //TODO PAU ideally this should be set to true after payment is confirmed. this will require listening for new redsys_orders docs with the orderId and checking the status field
      setCart(null);
    }, 5000);
  };

  const getPaymentFormInfo = () => {
    const finalAmount = cartTotalPrice + ((event?.ticket_fee ? event.ticket_fee * cartTotalQuantity : 0));
    fetch('https://getforminfosb-estcwhnvtq-ew.a.run.app', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + session.access_token
      },
      body: JSON.stringify({
        amount: finalAmount,
        userId: user.id,
        userRedsysToken: redsysToken,
        eventId: event.id
      })
    })
    .then((response) => response.json())
    .then((data) => {
      if (!data) {
        return;
      }
      const formUrl = data.formUrl.replace(/\//g, '%2F');
      const Ds_MerchantParameters = data.Ds_MerchantParameters.replace(/\//g, '%2F');
      const Ds_Signature = data.Ds_Signature.replace(/\//g, '%2F');
      const Ds_SignatureVersion = data.Ds_SignatureVersion.replace(/\//g, '%2F');

      addPendingTicketsToUser(data.orderId);

      router.push(`/event/paymentModal/${event?.id}/${eventBackgroundColorIndex}/${formUrl}/${Ds_MerchantParameters}/${Ds_Signature}/${Ds_SignatureVersion}`);
      setLoading(false);
    })
    .catch((err) => {
      console.log('PAU LOG-> getFormInfo error: ', err);
      setLoading(false);
    });
  }

  const addPendingTicketsToUser = (orderId: string) => {
    if (!cart?.length || !cartTotalPrice || !event || !user) {
      return;
    }

    type NewWalletTicket = { //PAU maybe this is overkill type safety??
      event_id: WalletTicket['event_id'];
      event_tickets_id: WalletTicket['event_tickets_id'];
      order_id: WalletTicket['order_id'];
      price: WalletTicket['price'];
      used: WalletTicket['used'];
      user_id: WalletTicket['user_id'];
    };

    cart.forEach((cartItem) => {
      for (let i = 0; i < cartItem.quantity; i++) {
        const ticketToInsert: NewWalletTicket = { event_id: cartItem.eventTicket.event_id, event_tickets_id: cartItem.eventTicket.id, order_id: orderId, price: cartItem.eventTicket.price, used: false, user_id: user.id };
          supabase.from('wallet_tickets').insert(ticketToInsert)
          .select().then(({ data: wallet_tickets, error }) => { //TODO PAU this is very strange, if i just leave the insert (or insert and select) it doesnt actually insert the rows, but if i add select and then, it does.
            // if (error) {
            //   console.log('PAU LOG-> addPendingTicketsToUser error: ', error);
            //   return;
            // }
            // console.log('PAU LOG-> addPendingTicketsToUser success: ', wallet_tickets);
          });
      }
    });
  };

  const onGoToWallet = () => {
    router.push('/(tabs)/two');
  };

  return (
    <View style={[styles.container, {backgroundColor: Colors[theme].backgroundContrast}]}>
      { event ?
        <>
          <View style={[styles.eventInfoContainer, {backgroundColor: eventBackgroundColor}]}>
          {/* <View style={styles.eventInfoContainer}> */}
            <GoBackArrow />
            <Text style={[styles.title, {color: Colors['light'].text}]}>{ event?.name }</Text>
            <Text style={[styles.eventDescription, {color: Colors['light'].text}]}>{event.description || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt'}</Text>
          </View>
          { eventTickets ?
            <>
              <View style={styles.ticketsContainer}>
                <View style={styles.sellingStatusContainer}>
                  <View style={[styles.sellingStatusDot, {backgroundColor: event.selling ? 'green' : 'red'}]}></View>
                  <Text style={[styles.sellingStatus, {color: event.selling ? 'green' : 'red'}]}>{event.selling ? 'Venent' : 'No venent'}</Text>
                </View>
                <Text style={styles.subtitle}>Tickets:</Text>
                <FlatList
                  style={styles.ticketsList}
                  data={eventTickets}
                  renderItem={({ item }) => <EventTicketCardComponent eventSelling={event.selling} quantityInCart={cart?.find((cartItem) => cartItem.eventTicket.id === item.id)?.quantity ?? 0} onRemoveTicket={onRemoveTicketHandler} onAddTicket={onAddTicketHandler} ticket={item} />}
                />
              </View>
              { orderConfirmed ?
                <Pressable style={[styles.orderConfirmedContainer, {backgroundColor: Colors[theme].cartContainerBackground}]} onPress={onGoToWallet}>
                  <FeatherIcon name="check-circle" size={40} color={Colors[theme].text} />
                  <View style={styles.orderConfirmedTextContainer}><Text style={styles.orderConfirmedSubtitle}>Tickets afegits a la wallet</Text><FeatherIcon name="arrow-up-right" size={25} color={Colors[theme].text} /></View>
                </Pressable>
              :
                <View style={[styles.cartContainer, {backgroundColor: Colors[theme].cartContainerBackground}]}>
                  <View style={styles.cartTitleRowContainer}><Text style={styles.subtitle}>Cistella</Text><FeatherIcon name="shopping-cart" size={22} color={Colors[theme].text} /></View>
                  { cart?.length ?
                    <>
                      <FlatList
                        style={styles.cartList}
                        data={cart}
                        renderItem={({ item }) => <Text style={styles.cartItemsList}>{item.quantity}  -  {item.eventTicket.name} · {item.eventTicket.price/100}€</Text>}
                        ItemSeparatorComponent={() => <View style={{backgroundColor: 'transparent', height: 3}} />}
                      />
                      { event.ticket_fee ?
                        <View style={{backgroundColor: 'transparent', marginHorizontal: 8, flexDirection: 'row', alignItems: 'flex-end'}}>
                          <Text style={[styles.transactionFeePrice, {color: Colors[theme].cartContainerBackgroundContrast}]}>+ {event.ticket_fee * cartTotalQuantity / 100}€ </Text>
                          <Text style={[styles.transactionFeeText, {color: Colors[theme].cartContainerBackgroundContrast}]}>comissió de servei</Text>
                        </View>
                      : null }
                        { cardNumber ?
                          <View style={styles.usingCreditCardContainer}>
                            <FeatherIcon name="info" size={15} color={Colors[theme].cartContainerBackgroundContrast} />
                            <Text style={[styles.transactionFeeText, {color: Colors[theme].cartContainerBackgroundContrast}]}>Utilitzant la tarjeta {cardNumber.slice(-7)}</Text>
                          </View>
                        : null }
                      <Pressable style={[styles.buyButton, {backgroundColor: Colors[theme].cartContainerButtonBackground}]} onPress={onBuyCart}>
                      { loading ?
                        <ActivityIndicator style={{marginVertical: 1.5}} size="small" />
                      :
                        <Text style={styles.buyButtonText}>{(cartTotalPrice + (event?.ticket_fee ? event.ticket_fee * cartTotalQuantity : 0)) / 100 + '€  ·  Comprar'}</Text>
                      }
                      </Pressable>
                    </>
                  :
                    <Text style={[styles.emptyCard, {color: Colors[theme].cartContainerBackgroundContrast}]}>No hi ha tickets a la cistella</Text>
                  }
                </View>
              }
            </>
          :
            <></>
          }
        </>
        :
        <ActivityIndicator style={{marginTop: '90%'}} size="large" />
      }
      {/* <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} /> */}
    </View> 
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    display: 'flex',
    height: '100%'
  },
  eventInfoContainer: {
    height: 180,
    justifyContent: 'flex-end',
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderRadius: 35,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.10,
    shadowRadius: 2.5,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold'
  },
  subtitle: {
    fontSize: 25,
    fontWeight: '800'
  },
  eventDescription: {
    fontSize: 16,
    marginTop: 10
  },
  ticketsContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    marginTop: 25,
    marginHorizontal: 30,
    borderRadius: 35
  },
  ticketsList: {
    marginTop: 10
  },
  sellingStatusContainer: {
    backgroundColor: 'transparent',
    position: 'absolute',
    right: 10,
    top: 10,
    paddingVertical: 3,
    paddingLeft: 5,
    paddingRight: 5,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  sellingStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  sellingStatus: {
    fontSize: 11,
    fontWeight: '600'
  },
  orderConfirmedContainer: {
    position: 'absolute',
    flexDirection: 'column',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 20,
    width: '95%',
    bottom: 25,
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderRadius: 35,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 10
  },
  orderConfirmedTextContainer: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  orderConfirmedSubtitle: {
    fontSize: 20,
    fontWeight: '800'
  },
  cartContainer: {
    position: 'relative',
    marginBottom: 25,
    alignSelf: 'center',
    width: '95%',
    paddingTop: 15,
    paddingBottom: 23,
    paddingHorizontal: 20,
    borderRadius: 35,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 10
  },
  cartTitleRowContainer: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  cartList: {
    marginVertical: 8,
    marginHorizontal: 15
  },
  cartItemsList: {
    fontSize: 18
  },
  usingCreditCardContainer: {
    backgroundColor: 'transparent',
    marginHorizontal: 8,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  transactionFeePrice: {
    fontSize: 16
  },
  transactionFeeText: {
    fontSize: 14
  },
  buyButton: {
    width: '100%',
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 10
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  emptyCard: {
    textAlign: 'center',
    marginTop: 10
  }
});
