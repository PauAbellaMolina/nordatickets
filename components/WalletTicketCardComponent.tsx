import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import Colors from '../constants/Colors';
import { Text, View } from './Themed';
import { FontAwesomeIcon } from './CustomIcons';
import { supabase } from "../supabase";
import { WalletTicket } from '../types/supabaseplain';

export default function WalletTicketCardComponent({ walletTicket }: { walletTicket: WalletTicket}) {
  const theme = useColorScheme() ?? 'light';
  const [eventTicketName, setEventTicketName] = useState<string>();
  const [eventTicketOrderStatus, setEventTicketOrderStatus] = useState<string>();
  const [eventTicketUsed, setEventTicketUsed] = useState<boolean>();

  useEffect(() => {
    if (!walletTicket) return;
    fetchTicketName();
    fetchTicketUsed();
  }, []);

  const fetchTicketName = () => {
    supabase.from('event_tickets').select().eq('id', walletTicket.event_tickets_id)
    .then(({ data: eventsTickets, error }) => {
      if (error || !eventsTickets.length) return;
      setEventTicketName(eventsTickets[0].name);
    });
  };

  const fetchTicketUsed = () => {
    supabase.from('wallet_tickets').select().eq('id', walletTicket.id)
    .then(({ data: walletTickets, error }) => {
      if (error || !walletTickets.length) return;
      const used = walletTickets[0].used;
      setEventTicketUsed(used);
      if (!used) {
        fetchTicketOrderStatus();
        subscribeRedsysOrders();
      }
    });
  };

  const fetchTicketOrderStatus = () => {
    supabase.from('redsys_orders').select().eq('order_id', walletTicket.order_id)
    .then(({ data: redsysOrders, error }) => {
      if (error || !redsysOrders.length) return;
      setEventTicketOrderStatus(redsysOrders[0].order_status);
    });
  };

  const subscribeRedsysOrders = () => {
    supabase
    .channel('redsys_orders')
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'redsys_orders',
        filter: `order_id=eq.${walletTicket.order_id}`
      },
      (payload) => fetchTicketOrderStatus())
    .subscribe();
  };

  const onActivateTicket = () => {
    if (eventTicketOrderStatus !== 'PAYMENT_SUCCEDED') {
      return;
    }
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

const styles = StyleSheet.create({
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