import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import {  doc, getDoc } from 'firebase/firestore';
import { FIRESTORE_DB } from '../firebaseConfig';
import { Event, WalletTicket, WalletTicketGroup } from '../types';
import Colors from '../constants/Colors';
import { Text, View } from './Themed';
import { FontAwesomeIcon } from './CustomIcons';

export default function WalletTicketGroupCardComponent(walletTicket: WalletTicketGroup) {
  const theme = useColorScheme() ?? 'light';
  const [event, setEvent] = useState<Event>();
  const [eventBackgroundColor, setEventBackgroundColor] = useState<string>(Colors[theme].backgroundContrast);
  const [orderStatusAdded, setOrderStatusAdded] = useState<boolean>(false);
  const [refreshCooldown, setRefreshCooldown] = useState<boolean>(false);
  const [refreshingEvent, setRefreshingEvent] = useState<boolean>(false);
  const [lastRefresed, setLastRefresed] = useState<Date>(new Date());

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
      if (!doc.exists()) {
        return;
      }
      const docEvent = new Event(doc.data());
      docEvent.id = doc.id;
      setEvent(docEvent);
      addTicketsPaymentStatus();
    });
  }, []);
  
  const addTicketsPaymentStatus = () => {
    for (let i = 0; i < walletTicket.walletTickets.length; i++) {
      const ticket = walletTicket.walletTickets[i];
      if (!ticket.orderId) {
        continue;
      }
      const orderIdDocRef = doc(FIRESTORE_DB, 'redsys_orders', ticket.orderId);
      getDoc(orderIdDocRef)
      .then((doc) => {
        if (!doc.exists()) {
          return;
        }
        ticket.orderStatus = doc.data().status;
      })
      .finally(() => {
        if (i === walletTicket.walletTickets.length - 1) {
          setOrderStatusAdded(true);
        }
      });
    }
  };

  const onRefreshEvent = () => {
    if (refreshingEvent || (new Date().getTime() - lastRefresed.getTime()) < 5000) { //PAU info 5 seconds between refresh calls
      return;
    }
    setRefreshCooldown(true);
    setRefreshingEvent(true);
    setLastRefresed(new Date());
    for (let i = 0; i < walletTicket.walletTickets.length; i++) {
      const ticket = walletTicket.walletTickets[i];
      if (!ticket.orderId) {
        continue;
      }
      const orderIdDocRef = doc(FIRESTORE_DB, 'redsys_orders', ticket.orderId);
      getDoc(orderIdDocRef)
      .then((doc) => {
        if (!doc.exists()) {
          return;
        }
        ticket.orderStatus = doc.data().status;
      })
      .finally(() => {
        if (i === walletTicket.walletTickets.length - 1) {
          setRefreshingEvent(false);
          setTimeout(() => {
            setRefreshCooldown(false);
          }, 5000);
        }
      });
    }
  };

  const SingleTicketComponent = (walletTicket: WalletTicket) => {
    const onActivateTicket = () => {
      if (walletTicket.orderStatus !== 'PAYMENT_SUCCEDED') {
        return;
      }
      router.push(`/wallet/activateTicket/${event?.id}/${event?.name}/${walletTicket.id}/${walletTicket.eventTicketId}/${walletTicket.name}/${walletTicket.price}/${walletTicket.orderId}/${event?.usedTicketBucketRef.id}`);
    };
  
    return (
      <>{ walletTicket.orderStatus === 'PAYMENT_SUCCEDED' ?
        <Pressable style={[styles.singleTicketContainer, {backgroundColor: Colors[theme].backgroundHalfOpacity}]} onPress={onActivateTicket}>
          <View style={styles.ticketIconWrapper}>
            <FontAwesomeIcon name="ticket" size={30} color={Colors['light'].text} />
          </View>
          <View style={styles.ticketNameWrapper}>
            <Text style={[styles.ticketName, {color: Colors['light'].text}]} numberOfLines={1}>{walletTicket.name}</Text>
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
      { event && orderStatusAdded ?
        <View style={[styles.eventContainer, {backgroundColor: eventBackgroundColor}]}>
          <View style={styles.eventHeaderContainer}>
            <Text style={[styles.eventName, {color: Colors['light'].text}]}>{event.name}</Text>
            <Pressable style={{flexDirection: 'row', gap: 5, alignItems: 'center'}} onPress={() => onRefreshEvent()}>
              <FontAwesomeIcon name="refresh" size={12} color={Colors['light'].text} opacity={refreshCooldown ? .5 : 1} />
              <Text style={{color: Colors['light'].text, textDecorationLine: 'underline', opacity: refreshCooldown ? .5 : 1, fontWeight: '600', fontSize: 12}}>Refresca</Text>
            </Pressable>
          </View>
          { refreshingEvent ?
            <ActivityIndicator style={{marginVertical: 40}} size="small" />
          :
            <FlatList
              columnWrapperStyle={{flexWrap: 'wrap', gap: 10}}
              numColumns={2}
              style={styles.ticketsList}
              data={walletTicket.walletTickets}
              renderItem={({ item }) => <SingleTicketComponent {...item} />}
            />
          }
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
  eventHeaderContainer: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
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
    flex: 1,
    paddingHorizontal: 5
  },
  ticketName: {
    fontSize: 19,
    textAlign: 'center',
    fontWeight: '400',
    overflow: 'hidden'
  },
  ticketSubtitle: {
    fontSize: 12,
    textAlign: 'center'
  }
});