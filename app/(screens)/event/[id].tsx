import { useEffect, useState } from 'react';
import { ActivityIndicator, Button, FlatList, Platform, Pressable, StyleSheet, useColorScheme } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { FIRESTORE_DB } from '../../../firebaseConfig';
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
  const { funds, setFunds, cart, setCart, walletTicketGroups, setWalletTicketGroups } = useWallet();
  const { user, setUser } = useAuth();
  const [event, setEvent] = useState<Event>();
  const [cardTotalPrice, setCardTotalPrice] = useState<number>(0);
  const [eventCardBackgroundColor, setEventCardBackgroundColor] = useState<string>(Colors[theme].backgroundContrast);

  const chooseRandomColor = (): string => {
    const colors = Colors.eventCardBackgroundColorsArray
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
  };

  useEffect(() => {
    setEventCardBackgroundColor(chooseRandomColor);

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

  const getEnoughFunds = (): boolean => {
    if (!funds || !cardTotalPrice) {
      return false;
    }
    return funds >= cardTotalPrice;
  };

  const onBuyCart = () => {
    if (!cart?.length || !funds || !cardTotalPrice || !event || !user) {
      return;
    }

    setFunds(funds - cardTotalPrice);

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
          // ticketToPush.id = event.id + '_' + user.id + '_' + firestoreAutoId(); //TODO PAU this is actually not needed
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

  
  return (
    <View style={[styles.container, {backgroundColor: Colors[theme].backgroundContrast}]}>
      { event ?
        <>
          {/* <View style={[styles.eventInfoContainer, {backgroundColor: eventCardBackgroundColor}]}> */}
          <View style={styles.eventInfoContainer}>
            <Text style={styles.title}>{ event?.name }</Text>
            <Text style={styles.eventDescription}>{event.description || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt'}</Text>
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
                  renderItem={({ item }) => <TicketCardComponent quantityInCart={cart?.find((cartItem) => cartItem.ticket.ticketId === item.ticketId)?.quantity ?? 0} onRemoveTicket={onRemoveTicketHandler} onAddTicket={onAddTicketHandler} ticket={item} />}
                  // ItemSeparatorComponent={() => <View style={{height: 10, backgroundColor: 'transparent'}} />}
                />
              </View>

              <View style={styles.cartContainer}>
                <View style={styles.cartTitleRowContainer}><Text style={[styles.subtitle, {color: Colors['light'].text}]}>Cart:</Text>{ cart?.length ? <Text style={{color: 'gray'}}><FeatherIcon size={13} name='info' color='gray' /> Your balance is {funds ?? 0}€</Text> : <></> }</View>
                { cart?.length ?
                  <>
                    <FlatList
                      style={styles.cartList}
                      data={cart}
                      renderItem={({ item }) => <Text style={[styles.cartItemsList, {color: Colors['light'].text}]}>{item.quantity}  -  {item.ticket.name} · {item.ticket.price}€</Text>}
                      // ItemSeparatorComponent={() => <View style={{height: 3}} />}
                    />
                    {/* <View style={styles.totalContainer}>
                      <Text style={styles.totalPrice}>Total: {cardTotalPrice}€</Text>
                      { getEnoughFunds() ? <Button title='Buy now' onPress={onBuyCart} /> : <Button title='Not enough funds!' color='red' /> }
                    </View>
                    { !getEnoughFunds() ? <View style={{width: 120, alignSelf: 'flex-end'}}><Button title='Add money' onPress={() => router.push('/wallet/addFunds')} /></View> : <></> } */}
                    { !getEnoughFunds() ? <Text style={styles.notEnoughFunds}>Not enough funds!</Text> : <></> }
                    <Pressable style={styles.buyButton} onPress={getEnoughFunds() ? onBuyCart : () => {router.push('/wallet/addFunds')}}>
                      <Text style={styles.buyButtonText}>{ getEnoughFunds() ? cardTotalPrice + '€  ·   Buy now' : 'Add funds' }</Text>
                    </Pressable>
                  </>
                :
                  <Text style={styles.emptyCard}>No tickets added to cart</Text>
                }
              </View>
            </>
          :
            <></>
          }
        </>
        :
        <ActivityIndicator style={{marginTop: '90%'}} size="large" />
      }
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View> 
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    // paddingTop: 10,
    paddingTop: 80,
    paddingHorizontal: 20,
    flex: 1
  },
  eventInfoContainer: {
    backgroundColor: 'transparent',
    // paddingTop: 15,
    // paddingBottom: 23,
    // paddingHorizontal: 20,
    borderRadius: 35,
    // shadowColor: "#000",
    // shadowOffset: {
    //   width: 0,
    //   height: -2,
    // },
    // shadowOpacity: 0.10,
    // shadowRadius: 1.5,
    // elevation: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold'
  },
  subtitle: {
    fontSize: 25,
    fontWeight: 'bold'
  },
  eventDescription: {
    fontSize: 18,
    marginTop: 10,
    // marginLeft: 10
  },
  ticketsContainer: {
    backgroundColor: 'transparent',
    marginTop: 40,
    marginHorizontal: 10,
    // paddingTop: 15,
    // paddingBottom: 23,
    // paddingHorizontal: 20,
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
  cartContainer: {
    position: 'absolute',
    alignSelf: 'center',
    width: '95%',
    bottom: 25,
    backgroundColor: '#C5EDDF',
    paddingTop: 15,
    paddingBottom: 23,
    paddingHorizontal: 20,
    // marginHorizontal: 20,
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
    backgroundColor: '#161211',
    paddingVertical: 10,
    // paddingHorizontal: 15,
    borderRadius: 10
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  // totalContainer: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   alignItems: 'center',
  //   backgroundColor: 'transparent'
  // },
  // totalPrice: {
  //   fontSize: 20,
  //   fontWeight: 'bold',
  //   // lineHeight: 20,
  // },
  emptyCard: {
    textAlign: 'center',
    color: 'grey',
    marginTop: 10
  }
});
