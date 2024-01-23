import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, useColorScheme } from 'react-native';
import { router } from 'expo-router';
// import {  doc, getDoc } from 'firebase/firestore';
// import { FIRESTORE_DB } from '../firebaseConfig';
// import { WalletTicket, WalletTicketGroup } from '../types';
import Colors from '../constants/Colors';
import { Text, View } from './Themed';
import { FontAwesomeIcon } from './CustomIcons';
import { supabase } from "../supabase";
import { Event, WalletTickets } from '../types/supabaseplain';

export default function EventWalletTicketsCardComponent(eventWalletTickets: WalletTickets[]) {
  const theme = useColorScheme() ?? 'light';
  const [event, setEvent] = useState<Event>();
  const [eventWalletTicketsArray] = useState<WalletTickets[]>(Object.values(eventWalletTickets));
  const [eventBackgroundColor, setEventBackgroundColor] = useState<string>(Colors[theme].backgroundContrast);
  // const [orderStatusAdded, setOrderStatusAdded] = useState<boolean>(false);
  // const [refreshCooldown, setRefreshCooldown] = useState<boolean>(false);
  // const [refreshingEvent, setRefreshingEvent] = useState<boolean>(false);
  // const [lastRefresed, setLastRefresed] = useState<Date>(new Date());

  const chooseRandomColor = (): string => {
    const colors = Colors.eventBackgroundColorsArray[theme]
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
  };

  useEffect(() => {
    setEventBackgroundColor(chooseRandomColor);

    if (!eventWalletTicketsArray.length) return;
    supabase.from('events').select().eq('id', eventWalletTicketsArray[0].event_id)
    .then(({ data: events, error }) => {
      if (error || !events.length) return;
      setEvent(events[0]);
    });
  }, []);

  const onRefreshEvent = () => { //TODO PAU maybe this is not needed anymore?? definetly not needed if redsys orders statuses realtime is implemented
    // if (refreshingEvent || (new Date().getTime() - lastRefresed.getTime()) < 5000) { //PAU info 5 seconds between refresh calls
    //   return;
    // }
    // setRefreshCooldown(true);
    // setRefreshingEvent(true);
    // setLastRefresed(new Date());
    // for (let i = 0; i < walletTicket.walletTickets.length; i++) {
    //   const ticket = walletTicket.walletTickets[i];
    //   if (!ticket.orderId) {
    //     continue;
    //   }
    //   const orderIdDocRef = doc(FIRESTORE_DB, 'redsys_orders', ticket.orderId);
    //   getDoc(orderIdDocRef)
    //   .then((doc) => {
    //     if (!doc.exists()) {
    //       return;
    //     }
    //     ticket.orderStatus = doc.data().status;
    //   })
    //   .finally(() => {
    //     if (i === walletTicket.walletTickets.length - 1) {
    //       setRefreshingEvent(false);
    //       setTimeout(() => {
    //         setRefreshCooldown(false);
    //       }, 5000);
    //     }
    //   });
    // }
  };

  const SingleTicketComponent = (walletTicket: WalletTickets) => {
    const [eventTicketName, setEventTicketName] = useState<string>();
    const [eventTicketOrderStatus, setEventTicketOrderStatus] = useState<string>();
    const [eventTicketUsed, setEventTicketUsed] = useState<boolean>();

    useEffect(() => { //TODO PAU This is called multiple times, even when navigating to another tab. Maybe its useful to have the latest used bool and order status, but it should be called only when rendering and not again when navigating to another tab.
      if (!walletTicket) return;
      supabase.from('event_tickets').select().eq('id', walletTicket.event_tickets_id)
      .then(({ data: eventsTickets, error }) => {
        if (error || !eventsTickets.length) return;
        setEventTicketName(eventsTickets[0].name);
      });

      supabase.from('redsys_orders').select().eq('order_id', walletTicket.order_id)
      .then(({ data: redsysOrders, error }) => {
        if (error || !redsysOrders.length) return;
        setEventTicketOrderStatus(redsysOrders[0].order_status);
      });

      supabase.from('wallet_tickets').select().eq('id', walletTicket.id)
      .then(({ data: walletTickets, error }) => {
        if (error || !walletTickets.length) return;
        setEventTicketUsed(walletTickets[0].used);
      });
    }, []);

    const onActivateTicket = () => {
      if (eventTicketOrderStatus !== 'PAYMENT_SUCCEDED') {
        return;
      }
      // router.push(`/wallet/activateTicket/${event?.id}/${event?.name}/${walletTicket.id}/${walletTicket.event_tickets_id}/${eventTicketName}/${walletTicket.price}/${walletTicket.order_id}/${event?.usedTicketBucketRef.id}`);
      router.push(`/wallet/activateTicket/${walletTicket.id}/${eventTicketName}/${walletTicket.event_id}`);
    };
  
    return (
      <>{ !eventTicketUsed && eventTicketName && eventTicketOrderStatus === 'PAYMENT_SUCCEDED' ?
        <Pressable style={[styles.singleTicketContainer, {backgroundColor: Colors[theme].backgroundHalfOpacity}]} onPress={onActivateTicket}>
          <View style={styles.ticketIconWrapper}>
            <FontAwesomeIcon name="ticket" size={30} color={Colors['light'].text} />
          </View>
          <View style={styles.ticketNameWrapper}>
            <Text style={[styles.ticketName, {color: Colors['light'].text}]} numberOfLines={1}>{eventTicketName}</Text>
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
          <View style={styles.eventHeaderContainer}>
            <Text style={[styles.eventName, {color: Colors['light'].text}]}>{event.name}</Text>
            {/* <Pressable style={{flexDirection: 'row', gap: 5, alignItems: 'center'}} onPress={() => onRefreshEvent()}>
              <FontAwesomeIcon name="refresh" size={12} color={Colors['light'].text} opacity={refreshCooldown ? .5 : 1} />
              <Text style={{color: Colors['light'].text, textDecorationLine: 'underline', opacity: refreshCooldown ? .5 : 1, fontWeight: '600', fontSize: 12}}>Refresca</Text>
            </Pressable> */}
          </View>
          {/* { refreshingEvent ?
            <ActivityIndicator style={{marginVertical: 40}} size="small" />
          : */}
            <FlatList
              columnWrapperStyle={{flexWrap: 'wrap', gap: 10}}
              numColumns={2}
              style={styles.ticketsList}
              data={eventWalletTicketsArray}
              renderItem={({ item }) => <SingleTicketComponent {...item} />}
            />
          {/* } */}
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