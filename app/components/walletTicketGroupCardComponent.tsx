import { useEffect, useState } from 'react';
import { ActivityIndicator, Button, FlatList, Pressable, StyleSheet, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { FIRESTORE_DB } from '../../firebaseConfig';
import { Event, Ticket, WalletTicketGroup } from '../types';
import Colors from '../../constants/Colors';
import { Text, View } from '../../components/Themed';
import { FontAwesomeIcon } from './icons';

export default function WalletTicketGroupCardComponent(walletTicket: WalletTicketGroup) {
  const theme = useColorScheme() ?? 'light';
  const [event, setEvent] = useState<Event>();
  const [eventBackgroundColor, setEventBackgroundColor] = useState<string>(Colors[theme].backgroundContrast);

  const chooseRandomColor = (): string => {
    const colors = Colors.eventBackgroundColorsArray[theme]
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
  };

  useEffect(() => {
    setEventBackgroundColor(chooseRandomColor);

    const eventDocRef = doc(FIRESTORE_DB, 'events', walletTicket.eventId);
    getDoc(eventDocRef)
    .then((doc) => {
      if (doc.exists()) {
        const event = doc.data() as Event;
        event.id = doc.id;
        event.usedTicketBucketId = doc.data().usedTicketBucketRef.id;
        delete (event as any).ticketBucketRef;
        delete (event as any).usedTicketBucketRef;
        setEvent(event);
      } else {
        console.log('No event doc found with id: ', walletTicket.eventId);
      }
    });
  }, []);

  const SingleTicketComponent = (ticket: Ticket) => { //TODO PAU IMPORTANT; this is rerendering when navigating out of tab two, for no reason, fix this
    const [ticketOrderStatus, setTicketOrderStatus] = useState<string>('');

    const random = Math.random();

    useEffect(() => {
      console.log('init', random);
      if (!ticket.orderId) {
        return;
      }
      const orderIdDocRef = doc(FIRESTORE_DB, 'redsys_orders', ticket.orderId);
      getDoc(orderIdDocRef)
      .then((doc) => {
        if (doc.exists()) {
          // console.log(doc.data());
          setTicketOrderStatus(doc.data().status);
        } else {
          console.log('No order doc found with id: ', ticket.orderId);
        }
      });
    }, [ticket]);
    
    const onActivateTicket = () => {
      if (ticketOrderStatus !== 'PAYMENT_SUCCEDED') {
        return;
      }
      router.push(`/wallet/activateTicket/${event?.id}/${event?.name}/${ticket.id}/${ticket.ticketId}/${ticket.name}/${ticket.price}/${event?.usedTicketBucketId}`);
    };

    // const orderStatus = () => {
    //   switch (ticketOrderStatus) {
    //     case 'PENDING_PAYMENT':
    //       return 'Processing payment...';
    //     case 'PAYMENT_SUCCEDED':
    //       return 'Activable';
    //     case 'PAYMENT_FAILED':
    //       return 'Payment failed';
    //     default:
    //       return null;
    //   }
    // };
  
    return (
      <>{ ticketOrderStatus === 'PAYMENT_SUCCEDED' ?
        <Pressable style={[styles.singleTicketContainer, {backgroundColor: Colors[theme].backgroundHalfOpacity}]} onPress={onActivateTicket}>
          <View style={styles.ticketIconWrapper}>
            <FontAwesomeIcon name="ticket" size={30} color={Colors['light'].text} />
          </View>
          <View style={styles.ticketNameWrapper}>
            <Text style={[styles.ticketName, {color: Colors['light'].text}]}>{ticket.name}</Text>
            <Text style={[styles.ticketSubtitle, {color: theme === 'dark' ? 'lightgray' : 'gray'}]}>Activable</Text>
          </View>
        </Pressable>
      :
        null
      }</>
    );
  };
  
  return (
    <>
      { event ?
        <View style={[styles.eventContainer, {backgroundColor: eventBackgroundColor}]}>
          <Text style={[styles.eventName, {color: Colors['light'].text}]}>{event.name}</Text>
          <FlatList
            columnWrapperStyle={{flexWrap: 'wrap', gap: 10}}
            numColumns={2}
            style={styles.ticketsList}
            data={walletTicket.tickets}
            renderItem={({ item }) => <SingleTicketComponent {...item} />}
          />
        </View>
      :
        <ActivityIndicator style={{marginTop: '25%'}} size="large" />
      }
    </>
  );
}

const styles = StyleSheet.create({
  eventContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10
  },
  eventName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5
  },
  ticketsList: {
    marginTop: 10
  },
  singleTicketContainer: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5
  },
  ticketIconWrapper: {
    backgroundColor: 'transparent',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderRadius: 10,
    margin: -2,
    borderStyle: 'dashed'
  },
  ticketNameWrapper: {
    backgroundColor: 'transparent',
    flex: 1
  },
  ticketName: {
    fontSize: 19,
    textAlign: 'center',
    fontWeight: '400'
  },
  ticketSubtitle: {
    fontSize: 12,
    textAlign: 'center'
  }
});