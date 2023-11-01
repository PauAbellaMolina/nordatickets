import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, useColorScheme } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { addDoc, collection, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useStripe } from '@stripe/stripe-react-native';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../../firebaseConfig';
import { firestoreAutoId } from '../../../utils/firestoreAutoId';
import { Event, Ticket, WalletTicketGroup, WalletTicketGroups } from '../../types';
import { useAuth } from '../../../context/AuthProvider';
import { useWallet } from '../../../context/WalletProvider';
import { Text, View } from '../../../components/Themed';
import TicketCardComponent from '../../components/ticketCardComponent';
import Colors from '../../../constants/Colors';
import { FeatherIcon } from '../../components/icons';

export default function EventDetailScreen() {
  const theme = useColorScheme() ?? 'light';
  const { id } = useLocalSearchParams();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { cart, setCart, walletTicketGroups, setWalletTicketGroups } = useWallet();
  const { user, setUser } = useAuth();
  const [eventBackgroundColor, setEventBackgroundColor] = useState<string>(Colors[theme].backgroundContrast);
  const [event, setEvent] = useState<Event>();
  const [cardTotalPrice, setCardTotalPrice] = useState<number>(0);
  const [stripePaymentSheetParams, setStripePaymentSheetParams] = useState<{ paymentIntentClientSecret: string, ephemeralKeySecret: string, customer: string }>();
  const [loading, setLoading] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [emailVerified, setEmailVerified] = useState<boolean>(FIREBASE_AUTH.currentUser?.emailVerified ?? false);

  const chooseRandomColor = (): string => {
    const colors = Colors.eventBackgroundColorsArray[theme]
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
  };

  useEffect(() => {
    setEventBackgroundColor(chooseRandomColor);

    const eventDocRef = doc(FIRESTORE_DB, 'events', id as string);
    getDoc(eventDocRef)
    .then((doc) => {
      if (doc.exists()) {
        const docEvent = doc.data() as Event;
        docEvent.id = doc.id;
        delete (docEvent as any).ticketBucketRef;
        const ticketBucketRef = doc.data().ticketBucketRef;
        if (ticketBucketRef) {
          getDoc(ticketBucketRef)
          .then((doc) => {
            if (doc.exists()) {
              docEvent.tickets = doc.data() as { tickets: Ticket[] };
              setEvent(docEvent);
              // console.log('PAU LOG-> event: ', event);
            } else {
              console.log('No references doc found');
            }
          });
        } else {
          setEvent(docEvent);
        }
      } else {
        console.log('No doc found with id: ', id);
      }
    });

    return () => setCart(null);
  }, []);

  useEffect(() => { //TODO PAU info this adds event to user's event following list. Idea is to make a qr to go to this page (event/id) and that will add it to user's event list.
    if (!event || !user || user.eventIdsFollowing.includes(id as string)) {
      return;
    }
    const userDocRef = doc(FIRESTORE_DB, 'users', user.id);
    updateDoc(userDocRef, {
      eventIdsFollowing: [...user.eventIdsFollowing, id]
    }).then(() => {
      setUser({
        ...user,
        eventIdsFollowing: [...user.eventIdsFollowing, id as string]
      });
    });
  }, [event]);

  useEffect(() => {
    if (!cart) {
      setCardTotalPrice(0);
      return;
    }
    const totalPrice = cart.reduce((acc, cartItem) => acc + cartItem.ticket.price * cartItem.quantity, 0);
    setCardTotalPrice(totalPrice);
  }, [cart]);

  useEffect(() => {
    initializePaymentSheet();
  }, [stripePaymentSheetParams]);

  const initializePaymentSheet = async () => {
    if (!stripePaymentSheetParams) {
      return;
    }
    const { error } = await initPaymentSheet({
      merchantDisplayName: "Tickets MVP, Inc.",
      customerId: stripePaymentSheetParams.customer,
      customerEphemeralKeySecret: stripePaymentSheetParams.ephemeralKeySecret,
      paymentIntentClientSecret: stripePaymentSheetParams.paymentIntentClientSecret,
      // Set `allowsDelayedPaymentMethods` to true if your business can handle payment
      //methods that complete payment after a delay, like SEPA Debit and Sofort.
      allowsDelayedPaymentMethods: false,
      // defaultBillingDetails: {
      //   name: 'Jane Doe',
      // }
    });
    if (error) {
      console.log('PAU LOG-> error: ', error);
      Alert.alert("Unexpected error", "Please try again.");
      setLoading(false);
    } else {
      spawnPaymentSheet();
    }
  };

  const spawnPaymentSheet = async () => {
    const { error } = await presentPaymentSheet();
    if (error) {
      // Alert.alert(error.code, error.message);
      setLoading(false);
    } else {
      // Alert.alert('Success', 'Your order is confirmed!');
      stripeOrderConfirmed();
    }
  };

  const onAddTicketHandler = (ticket: Ticket) => {
    // console.log('PAU LOG-> ticket to add: ', cart, ticket);
    if (cart) {
      const existingCartItem = cart.find((cartItem) => cartItem.ticket.ticketId === ticket.ticketId);
      if (existingCartItem) {
        existingCartItem.quantity++;
        setCart([...cart]);
      } else {
        setCart([...cart, {ticket: ticket, quantity: 1}]);
      }
    } else {
      setCart([{ticket: ticket, quantity: 1}]);
    }
  };
  const onRemoveTicketHandler = (ticket: Ticket) => {
    // console.log('PAU LOG-> ticket to remove: ', ticket);
    if (cart) {
      const existingCartItem = cart.find((cartItem) => cartItem.ticket.ticketId === ticket.ticketId);
      if (existingCartItem) {
        existingCartItem.quantity--;
        if (existingCartItem.quantity === 0) {
          const newCart = cart.filter((cartTicket) => cartTicket.ticket.ticketId !== ticket.ticketId);
          setCart(newCart);
        } else {
          setCart([...cart]);
        }
      }
    }
  };

  const stripeOrderConfirmed = () => {
    if (!cart?.length || !cardTotalPrice || !event || !user) {
      return;
    }

    setOrderConfirmed(true);
    // setTimeout(() => {
    //   setOrderConfirmed(false);
    // }, 5000);

    const newTickets: Array<Ticket> = [];
    cart.forEach((cartItem) => {
      if (cartItem.quantity === 0) {
        const ticketToPush = cartItem.ticket;
        ticketToPush.id = event.id + '_' + user.id + '_' + firestoreAutoId();
        delete ticketToPush.selling;
        newTickets.push(ticketToPush);
      } else {
        for (let i = 0; i < cartItem.quantity; i++) {
          const ticketToPush = {...cartItem.ticket};
          ticketToPush.id = firestoreAutoId();
          delete ticketToPush.selling;
          newTickets.push(ticketToPush);
        }
      }
    });

    const existingWalletTicketGroup = walletTicketGroups?.find((walletTicketGroup) => walletTicketGroup.eventId === event?.id);
    if (existingWalletTicketGroup) {
      existingWalletTicketGroup.tickets = [...existingWalletTicketGroup.tickets, ...newTickets];
      setWalletTicketGroups([...walletTicketGroups ?? []]);
    } else {
      const newWalletTicketGroup: WalletTicketGroup = {
        eventId: event?.id ?? '',
        tickets: newTickets
      };
      const newWalletTicketGroups: WalletTicketGroups = [newWalletTicketGroup];
      setWalletTicketGroups([...walletTicketGroups ?? [], ...newWalletTicketGroups]);
    }

    setCart(null);
  };

  const createCheckoutSession = () => {
    if (!user?.id) {
      return;
    }
    const userDocRef = doc(FIRESTORE_DB, 'users', user.id);
    const checkoutSessionsRef = collection(userDocRef, 'checkout_sessions');
    addDoc(checkoutSessionsRef, {
      client: 'mobile',
      mode: 'payment',
      amount: cardTotalPrice*100,
      currency: 'eur'
    }).then((docRef) => {
      onSnapshot(docRef, (snapshot) => {
        const data = snapshot.data();
        if (data && data.paymentIntentClientSecret && data.ephemeralKeySecret && data.customer) {
          setStripePaymentSheetParams({
            paymentIntentClientSecret: data.paymentIntentClientSecret,
            ephemeralKeySecret: data.ephemeralKeySecret,
            customer: data.customer
          });
        }
      });
    }).catch((err) => {
      console.log('PAU LOG-> addFunds: ', err);
    });
  };
  
  const onBuyCart = () => {
    if (loading) {
      return;
    }
    setLoading(true);
    if (!emailVerified) {
      FIREBASE_AUTH.currentUser?.reload()
      .then(() => {
        if (!FIREBASE_AUTH.currentUser?.emailVerified) {
          Alert.alert('Email not verified', 'Please verify your email to continue');
          setLoading(false);
        } else {
          setEmailVerified(true);
          createCheckoutSession();
        }
      });
      return;
    } else {
      createCheckoutSession();
    }
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
            <Text style={[styles.title, {color: Colors['light'].text}]}>{ event?.name }</Text>
            <Text style={[styles.eventDescription, {color: Colors['light'].text}]}>{event.description || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt'}</Text>
          </View>
          { event.tickets ?
            <>
              <View style={styles.ticketsContainer}>
              <View style={styles.sellingStatusContainer}>
                <View style={[styles.sellingStatusDot, {backgroundColor: event.selling ? 'green' : 'red'}]}></View>
                <Text style={[styles.sellingStatus, {color: event.selling ? 'green' : 'red'}]}>{event.selling ? 'Selling' : 'Not selling'}</Text>
              </View>
                <Text style={styles.subtitle}>Tickets:</Text>
                <FlatList
                  style={styles.ticketsList}
                  data={event.tickets.tickets}
                  renderItem={({ item }) => <TicketCardComponent eventSelling={event.selling} quantityInCart={cart?.find((cartItem) => cartItem.ticket.ticketId === item.ticketId)?.quantity ?? 0} onRemoveTicket={onRemoveTicketHandler} onAddTicket={onAddTicketHandler} ticket={item} />}
                />
              </View>
              { orderConfirmed ?
                <Pressable style={[styles.orderConfirmedContainer, {backgroundColor: Colors[theme].cardContainerBackground}]} onPress={onGoToWallet}>
                  <FeatherIcon name="check-circle" size={40} color={Colors[theme].text} />
                  <View style={{backgroundColor: 'transparent', flexDirection: 'row', alignItems: 'center', gap: 5}}><Text style={styles.orderConfirmedSubtitle}>Tickets added to your wallet</Text><FeatherIcon name="arrow-up-right" size={25} color={Colors[theme].text} /></View>
                </Pressable>
              :
                <View style={[styles.cartContainer, {backgroundColor: Colors[theme].cardContainerBackground}]}>
                  <View style={{backgroundColor: 'transparent', flexDirection: 'row', alignItems: 'center', gap: 5}}><Text style={styles.subtitle}>Cart</Text><FeatherIcon name="shopping-cart" size={22} color={Colors[theme].text} /></View>
                  { cart?.length ?
                    <>
                      <FlatList
                        style={styles.cartList}
                        data={cart}
                        renderItem={({ item }) => <Text style={styles.cartItemsList}>{item.quantity}  -  {item.ticket.name} · {item.ticket.price}€</Text>}
                      />
                      <Pressable style={styles.buyButton} onPress={onBuyCart}>
                      { loading ?
                        <ActivityIndicator style={{marginVertical: 3.2}} size="small" />
                      :
                        <Text style={styles.buyButtonText}>{cardTotalPrice + '€  ·   Buy now'}</Text>
                      }
                      </Pressable>
                    </>
                  :
                    <Text style={[styles.emptyCard, {color: Colors[theme].cardContainerBackgroundContrast}]}>No tickets added to cart</Text>
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
    flex: 1
  },
  eventInfoContainer: {
    paddingTop: 100,
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
    marginTop: 10,
    // marginLeft: 10
  },
  ticketsContainer: {
    backgroundColor: 'transparent',
    marginTop: 25,
    marginHorizontal: 30,
    borderRadius: 35,
    // shadowColor: "#000",
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.10,
    // shadowRadius: 1.5,
    // elevation: 10,
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
  orderConfirmedSubtitle: {
    fontSize: 20,
    fontWeight: '800'
  },
  cartContainer: {
    position: 'absolute',
    alignSelf: 'center',
    width: '95%',
    bottom: 25,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent'
  },
  cartList: {
    marginVertical: 10
  },
  cartItemsList: {
    fontSize: 18
  },
  notEnoughFunds: {
    fontSize: 16,
    color: '#ff5f5f',
    textAlign: 'center'
  },
  buyButton: {
    width: '100%',
    marginTop: 10,
    backgroundColor: '#613AC5',
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
