import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, Pressable, StyleSheet, useColorScheme } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { FIREBASE_AUTH, FIREBASE_CF, FIRESTORE_DB } from '../../../firebaseConfig';
import { firestoreAutoId } from '../../../utils/firestoreAutoId';
import { Event, EventTicket, WalletTicket, WalletTicketGroup, WalletTicketGroups } from '../../../types';
import { useAuth } from '../../../context/AuthProvider';
import { useWallet } from '../../../context/WalletProvider';
import { Text, View } from '../../../components/Themed';
import TicketCardComponent from '../../../components/ticketCardComponent';
import Colors from '../../../constants/Colors';
import { FeatherIcon } from '../../../components/CustomIcons';
import { httpsCallable } from 'firebase/functions';
import GoBackArrow from '../../../components/goBackArrow';

export default function EventDetailScreen() {
  const theme = useColorScheme() ?? 'light';
  const { id } = useLocalSearchParams();
  const { cart, setCart, walletTicketGroups, setWalletTicketGroups } = useWallet();
  const { user, setUser } = useAuth();
  const [eventBackgroundColor, setEventBackgroundColor] = useState<string>(Colors[theme].backgroundContrast);
  const [eventBackgroundColorIndex, setEventBackgroundColorIndex] = useState<number>(0);
  const [event, setEvent] = useState<Event>();
  const [cardTotalPrice, setCardTotalPrice] = useState<number>(0);
  const [cardTotalQuantity, setCardTotalQuantity] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [emailVerified, setEmailVerified] = useState<boolean>(FIREBASE_AUTH.currentUser?.emailVerified ?? false);
  const [lastBuyAttempt, setLastBuyAttempt] = useState<Date | null>(null);

  const chooseRandomColor = (): string => {
    const colors = Colors.eventBackgroundColorsArray[theme]
    const randomIndex = Math.floor(Math.random() * colors.length);
    setEventBackgroundColorIndex(randomIndex);
    return colors[randomIndex];
  };

  useEffect(() => {
    setEventBackgroundColor(chooseRandomColor);

    const eventDocRef = doc(FIRESTORE_DB, 'events', id as string);
    getDoc(eventDocRef)
    .then((doc) => {
      if (!doc.exists()) {
        console.log('No doc found with id: ', id);
        return;
      }
      const docEvent = new Event(doc.data());
      docEvent.id = doc.id;
      setEvent(docEvent);
    });

    return () => setCart(null);
  }, []);

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
      setCardTotalPrice(0);
      setCardTotalQuantity(0);
      return;
    }
    const totalPrice = cart.reduce((acc, cartItem) => acc + cartItem.eventTicket.price * cartItem.quantity, 0);
    setCardTotalPrice(totalPrice);
    const totalQuantity = cart.reduce((acc, cartItem) => acc + cartItem.quantity, 0);
    setCardTotalQuantity(totalQuantity);
  }, [cart]);

  const onAddTicketHandler = (ticket: EventTicket) => {
    if (!cart) {
      setCart([{eventTicket: ticket, quantity: 1}]);
      return;
    }
    const existingCartItem = cart.find((cartItem) => cartItem.eventTicket.eventTicketId === ticket.eventTicketId);
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
    const existingCartItem = cart.find((cartItem) => cartItem.eventTicket.eventTicketId === ticket.eventTicketId);
    if (!existingCartItem) {
      return;
    }
    existingCartItem.quantity--;
    if (existingCartItem.quantity === 0) {
      const newCart = cart.filter((cartTicket) => cartTicket.eventTicket.eventTicketId !== ticket.eventTicketId);
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
    if (!emailVerified) {
      FIREBASE_AUTH.currentUser?.reload()
      .then(() => {
        if (!FIREBASE_AUTH.currentUser?.emailVerified) {
          if (Platform.OS === 'web') {
            window.confirm('Email not verified. Please verify your email to continue');
          } else {
            Alert.alert('Email not verified', 'Please verify your email to continue');
          }
          setLoading(false);
        } else {
          setEmailVerified(true);
          getPaymentFormInfo(); //Redsys
          setTimeout(() => {
            setOrderConfirmed(true); //TODO PAU ideally this should be set to true after payment is confirmed. this will require listening for new redsys_orders docs with the orderId and checking the status field
            setCart(null);
            listenToUserChanges();
          }, 5000);
        }
      });
      return;
    } else {
      getPaymentFormInfo(); //Redsys
      setTimeout(() => {
        setOrderConfirmed(true); //TODO PAU ideally this should be set to true after payment is confirmed. this will require listening for new redsys_orders docs with the orderId and checking the status field
        setCart(null);
        listenToUserChanges();
      }, 5000);
    }
  };

  const getPaymentFormInfo = () => {
    const finalAmount = cardTotalPrice + ((event?.ticketFee ? event.ticketFee * cardTotalQuantity : 0)/100); //PAU info (this is in euros (49.99));

    const userRedsysToken = user?.redsysToken ? user.redsysToken : undefined;
    
    //PAU info old fetch way
    // fetch('https://getforminfo-estcwhnvtq-ew.a.run.app', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     'totalAmount': finalAmount,
    //     'userId': user?.id,
    //     'userRedsysToken': userRedsysToken
    //   })
    // })
    // .then((response) => response.json())
    // .then((data) => {
    //   console.log('PAU LOG-> getFormInfo response: ', data);
    //   if (!data) {
    //     return;
    //   }
    //   const formUrl = data.formUrl.replace(/\//g, '%2F');
    //   const Ds_MerchantParameters = data.Ds_MerchantParameters.replace(/\//g, '%2F');
    //   const Ds_Signature = data.Ds_Signature.replace(/\//g, '%2F');
    //   const Ds_SignatureVersion = data.Ds_SignatureVersion.replace(/\//g, '%2F');

    //   addPendingTicketsToUser(data.orderId);

    //   router.push(`/event/paymentModal/${formUrl}/${Ds_MerchantParameters}/${Ds_Signature}/${Ds_SignatureVersion}`);
    //   setLoading(false);
    // })
    // .catch((err) => {
    //   console.log('PAU LOG-> getFormInfo error: ', err);
    //   setLoading(false);
    // });

    //PAU info new firebase cloud functions firebase sdk way
    const getFormInfoCF = httpsCallable(FIREBASE_CF, 'getFormInfo');
    getFormInfoCF({
      totalAmount: finalAmount,
      userId: user?.id,
      userRedsysToken: userRedsysToken
    })
    .then((result) => {
      // console.log('PAU LOG-> getFormInfoCF result: ', result);
      if (!result || !result.data) {
        return;
      }
      const data = result.data as any;
      const formUrl = data.formUrl.replace(/\//g, '%2F');
      const Ds_MerchantParameters = data.Ds_MerchantParameters.replace(/\//g, '%2F');
      const Ds_Signature = data.Ds_Signature.replace(/\//g, '%2F');
      const Ds_SignatureVersion = data.Ds_SignatureVersion.replace(/\//g, '%2F');

      addPendingTicketsToUser(data.orderId);

      router.push(`/event/paymentModal/${event?.id}/${eventBackgroundColorIndex}/${formUrl}/${Ds_MerchantParameters}/${Ds_Signature}/${Ds_SignatureVersion}`);
      setLoading(false);
    })
    .catch((err) => {
      console.log('PAU LOG-> getFormInfoCF error: ', err?.code, err?.message, err?.details);
      setLoading(false);
    });
  }

  const listenToUserChanges = () => {
    if (!user) {
      return;
    }
    const userDocRef = doc(FIRESTORE_DB, 'users', user.id);
    const userDocSubscription = onSnapshot(userDocRef, (doc) => {
      if (!doc.exists()) {
        return;
      }
      const docUser = doc.data();
      if (docUser?.redsysToken && docUser?.cardNumber && docUser?.expiryDate && (docUser.redsysToken !== user?.redsysToken || docUser.cardNumber !== user?.cardNumber || docUser.expiryDate !== user?.expiryDate)) {
        setUser({
          ...user,
          walletTicketGroups: docUser.walletTicketGroups,
          redsysToken: docUser.redsysToken,
          cardNumber: docUser.cardNumber,
          expiryDate: docUser.expiryDate
        });
        userDocSubscription();
      }
    });
  };

  const addPendingTicketsToUser = (orderId: string) => {
    if (!cart?.length || !cardTotalPrice || !event || !user) {
      return;
    }

    const newTickets: WalletTicket[] = [];
    cart.forEach((cartItem) => {
      for (let i = 0; i < cartItem.quantity; i++) {
        const ticketToPush: WalletTicket = { id: firestoreAutoId(), eventTicketId: cartItem.eventTicket.eventTicketId, name: cartItem.eventTicket.name, price: cartItem.eventTicket.price, orderId: orderId };
        newTickets.push(ticketToPush);
      }
    });

    const existingWalletTicketGroup = walletTicketGroups?.find((walletTicketGroup) => walletTicketGroup.eventId === event?.id);
    if (existingWalletTicketGroup) {
      existingWalletTicketGroup.walletTickets = [...existingWalletTicketGroup.walletTickets, ...newTickets];
      setWalletTicketGroups([...walletTicketGroups ?? []]);
    } else {
      const newWalletTicketGroup: WalletTicketGroup = {
        eventId: event?.id ?? '',
        walletTickets: newTickets
      };
      const newWalletTicketGroups: WalletTicketGroups = [newWalletTicketGroup];
      setWalletTicketGroups([...walletTicketGroups ?? [], ...newWalletTicketGroups]);
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
            <GoBackArrow />
            <Text style={[styles.title, {color: Colors['light'].text}]}>{ event?.name }</Text>
            <Text style={[styles.eventDescription, {color: Colors['light'].text}]}>{event.description || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt'}</Text>
          </View>
          { event.eventTickets ?
            <>
              <View style={styles.ticketsContainer}>
                <View style={styles.sellingStatusContainer}>
                  <View style={[styles.sellingStatusDot, {backgroundColor: event.selling ? 'green' : 'red'}]}></View>
                  <Text style={[styles.sellingStatus, {color: event.selling ? 'green' : 'red'}]}>{event.selling ? 'Venent' : 'No venent'}</Text>
                </View>
                <Text style={styles.subtitle}>Tickets:</Text>
                <FlatList
                  style={styles.ticketsList}
                  data={event.eventTickets}
                  renderItem={({ item }) => <TicketCardComponent eventSelling={event.selling} quantityInCart={cart?.find((cartItem) => cartItem.eventTicket.eventTicketId === item.eventTicketId)?.quantity ?? 0} onRemoveTicket={onRemoveTicketHandler} onAddTicket={onAddTicketHandler} ticket={item} />}
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
                        renderItem={({ item }) => <Text style={styles.cartItemsList}>{item.quantity}  -  {item.eventTicket.name} · {item.eventTicket.price}€</Text>}
                        ItemSeparatorComponent={() => <View style={{backgroundColor: 'transparent', height: 3}} />}
                      />
                      { event.ticketFee ?
                        <View style={{backgroundColor: 'transparent', marginHorizontal: 8, flexDirection: 'row', alignItems: 'flex-end'}}>
                          <Text style={[styles.transactionFeePrice, {color: Colors[theme].cartContainerBackgroundContrast}]}>+ {event.ticketFee * cardTotalQuantity / 100}€ </Text>
                          <Text style={[styles.transactionFeeText, {color: Colors[theme].cartContainerBackgroundContrast}]}>comissió de servei</Text>
                        </View>
                      : null }
                        { user && user.cardNumber ?
                          <View style={styles.usingCreditCardContainer}>
                            <FeatherIcon name="info" size={15} color={Colors[theme].cartContainerBackgroundContrast} />
                            <Text style={[styles.transactionFeeText, {color: Colors[theme].cartContainerBackgroundContrast}]}>Utilitzant la tarjeta {user.cardNumber.slice(-7)}</Text>
                          </View>
                        : null }
                      <Pressable style={[styles.buyButton, {backgroundColor: Colors[theme].cartContainerButtonBackground}]} onPress={onBuyCart}>
                      { loading ?
                        <ActivityIndicator style={{marginVertical: 1.5}} size="small" />
                      :
                        <Text style={styles.buyButtonText}>{cardTotalPrice + (event?.ticketFee ? event.ticketFee * cardTotalQuantity / 100 : 0) + '€  ·  Comprar'}</Text>
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
