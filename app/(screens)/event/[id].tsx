import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Button, Dimensions, FlatList, Platform, StyleSheet } from 'react-native';

import { Text, View } from '../../../components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { FIRESTORE_DB } from '../../../firebaseConfig';
import { Event, Ticket, WalletTickets } from '../../types';
import TicketCardComponent from '../../components/ticketCardComponent';
import { useWallet } from '../../../context/WalletProvider';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const [event, setEvent] = useState<Event>();
  const { cart, setCart, walletTickets, setWalletTickets } = useWallet();

  useEffect(() => {
    setCart(null);

    const eventDocRef = doc(FIRESTORE_DB, 'events', id as string);
    getDoc(eventDocRef)
    .then((doc) => {
      if (doc.exists()) {
        const event = doc.data() as Event;
        event.id = doc.id;
        delete (event as any).ticketBucketRef;
        const ticketBucketRef = doc.data().ticketBucketRef;
        if (ticketBucketRef) {
          getDoc(ticketBucketRef)
          .then((doc) => {
            if (doc.exists()) {
              event.tickets = doc.data() as { tickets: Ticket[] };
              setEvent(event);
              // console.log('PAU LOG-> event: ', event);
            } else {
              console.log('No references doc found');
            }
          });
        } else {
          setEvent(event);
        }
      } else {
        console.log('No doc found with id: ', id);
      }
    });
  }, []);

  const onAddTicketHandler = (ticket: Ticket) => {
    console.log('PAU LOG-> ticket to add: ', cart, ticket);
    if (cart) {
      const existingCartItem = cart.find((cartItem) => cartItem.ticket.id === ticket.id);
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
    console.log('PAU LOG-> ticket to remove: ', ticket);
    if (cart) {
      const existingCartItem = cart.find((cartItem) => cartItem.ticket.id === ticket.id);
      if (existingCartItem) {
        existingCartItem.quantity--;
        if (existingCartItem.quantity === 0) {
          const newCart = cart.filter((cartTicket) => cartTicket.ticket.id !== ticket.id);
          setCart(newCart);
        } else {
          setCart([...cart]);
        }
      }
    }
  };

  const onBuyCart = () => {
    if (!cart?.length) {
      return;
    }

    // export type WalletTicket = {
    //   eventName: string;
    //   ticket: Ticket;
    // };
    // export type WalletTickets = Array<WalletTicket> | null;
    //add cart tickets to setWalletTickets. if there is 3 tickets of the same type, add 3 wallet tickets of that type
    const newWalletTickets: WalletTickets = [];
    cart.forEach((cartItem) => {
      if (cartItem.quantity === 0) {
        newWalletTickets.push({eventName: event?.name ?? '', ticket: cartItem.ticket});
      } else {
        for (let i = 0; i < cartItem.quantity; i++) {
          newWalletTickets.push({eventName: event?.name ?? '', ticket: cartItem.ticket});
        } 
      }
    });
    setWalletTickets([...walletTickets ?? [], ...newWalletTickets]);
  };

  
  return (
    <View style={styles.container}>
      { event ?
        <>
          <Text style={styles.title}>{ event?.name }</Text>
          <Text ellipsizeMode='tail' numberOfLines={2} style={styles.eventDescription}>{event.description || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt'}</Text>
          { event.tickets ?
            <>
              <View style={styles.ticketsContainer}>
                <Text style={styles.subtitle}>Tickets:</Text>
                <FlatList
                  style={styles.ticketsList}
                  data={event.tickets.tickets}
                  renderItem={({ item }) => <TicketCardComponent onAddTicket={onAddTicketHandler} onRemoveTicket={onRemoveTicketHandler} ticket={{...item}} />}
                  ItemSeparatorComponent={() => <View style={{height: 10}} />}
                />
              </View>

              <View style={styles.ticketsContainer}>
                <Text style={styles.subtitle}>Cart:</Text>
                { cart?.length ?
                  <>
                    <FlatList
                      style={styles.cartList}
                      data={cart}
                      renderItem={({ item }) => <Text style={styles.cartItemsList}>{item.quantity}  -  {item.ticket.name} · {item.ticket.price}€</Text>}
                      ItemSeparatorComponent={() => <View style={{height: 3}} />}
                    />
                    <View style={styles.totalContainer}><Text style={styles.totalPrice}>Total: {cart?.reduce((acc, cartItem) => acc + cartItem.ticket.price * cartItem.quantity, 0)}€</Text><Button title='Buy now' onPress={onBuyCart} /></View>
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
    paddingTop: 15,
    paddingHorizontal: 15,
    flex: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 25,
    fontWeight: 'bold',
  },
  eventDescription: {
    fontSize: 18,
    marginTop: 10,
    marginLeft: 10,
  },
  ticketsContainer: {
    marginTop: 30,
    marginHorizontal: 10,
  },
  ticketsList: {
    marginTop: 10,
  },
  cartList: {
    marginVertical: 10,
  },
  cartItemsList: {
    fontSize: 18,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  emptyCard: {
    textAlign: 'center',
    color: 'grey',
    marginTop: 10
  }
});
