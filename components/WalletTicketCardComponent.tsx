import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, useColorScheme } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Colors from '../constants/Colors';
import { Text, View } from './Themed';
import { FontAwesomeIcon } from './CustomIcons';
import { supabase } from "../supabase";
import { WalletTicket } from '../types/supabaseplain';
import { RealtimeChannel } from '@supabase/supabase-js';

export default function WalletTicketCardComponent({ walletTicket }: { walletTicket: WalletTicket}) {
  const theme = useColorScheme() ?? 'light';
  const [eventTicketOrderStatus, setEventTicketOrderStatus] = useState<string>();
  const [eventTicketUsed, setEventTicketUsed] = useState<boolean>();

  let insertsRedsysOrdersChannel = useRef<RealtimeChannel>();
  let updatesRedsysOrdersChannel = useRef<RealtimeChannel>();

  let triggerNextFocus = useRef<boolean>(true);

  useFocusEffect(
    useCallback(() => {
      if (triggerNextFocus.current) {
        if (!walletTicket) return;
        fetchTicketUsed();
      }
      return () => {
        triggerNextFocus.current = false;
        if (insertsRedsysOrdersChannel.current) {
          supabase.removeChannel(insertsRedsysOrdersChannel.current);
          insertsRedsysOrdersChannel.current = null;
        }
        if (updatesRedsysOrdersChannel.current) {
          supabase.removeChannel(updatesRedsysOrdersChannel.current);
          updatesRedsysOrdersChannel.current = null;
        }
      };
    }, [])
  );

  const fetchTicketUsed = () => {
    supabase.from('wallet_tickets').select().eq('id', walletTicket.id)
    .then(({ data: walletTickets, error }) => {
      if (error || !walletTickets.length) return;
      const used = walletTickets[0].used;
      setEventTicketUsed(used);
      if (!used) {
        fetchTicketOrderStatus();
      }
    });
  };

  const fetchTicketOrderStatus = () => {
    supabase.from('redsys_orders').select().eq('order_id', walletTicket.order_id)
    .then(({ data: redsysOrders, error }) => {
      if (error) return;
      if (insertsRedsysOrdersChannel.current) {
        supabase.removeChannel(insertsRedsysOrdersChannel.current);
        insertsRedsysOrdersChannel.current = null;
      }
      if (!redsysOrders.length) {
        subscribeRedsysOrdersInserts();
        return;
      }
      const status = redsysOrders[0].order_status;
      setEventTicketOrderStatus(status);
      if (status === 'PENDING_PAYMENT') {
        if (updatesRedsysOrdersChannel.current) {
          supabase.removeChannel(updatesRedsysOrdersChannel.current);
          updatesRedsysOrdersChannel.current = null;
        }
        subscribeRedsysOrdersUpdates();
      }
      if (updatesRedsysOrdersChannel.current && (redsysOrders[0].order_status === 'PAYMENT_SUCCEDED' || redsysOrders[0].order_status === 'PAYMENT_FAILED')) {
        supabase.removeChannel(updatesRedsysOrdersChannel.current);
        updatesRedsysOrdersChannel.current = null;
      }
    });
  };

  const subscribeRedsysOrdersInserts = () => {
    const redsysOrdersChannel = supabase
    .channel(`redsys_orders:order_id=eq.${walletTicket.id}`)
    .on('postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'redsys_orders',
        filter: `order_id=eq.${walletTicket.order_id}`
      },
      (payload) => fetchTicketOrderStatus())
    .subscribe();

    insertsRedsysOrdersChannel.current = redsysOrdersChannel;
    
    const unsubscribeInterval = setInterval(() => {
      if (insertsRedsysOrdersChannel.current) {
        supabase.removeChannel(insertsRedsysOrdersChannel.current);
        insertsRedsysOrdersChannel.current = null;
        clearInterval(unsubscribeInterval);
      }
    }, 5000);
  };
  
  const subscribeRedsysOrdersUpdates = () => {
    const redsysOrdersChannel = supabase
    .channel(`redsys_orders:order_id=eq.${walletTicket.id}`)
    .on('postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'redsys_orders',
        filter: `order_id=eq.${walletTicket.order_id}`
      },
      (payload) => fetchTicketOrderStatus())
    .subscribe();

    updatesRedsysOrdersChannel.current = redsysOrdersChannel;

    const unsubscribeInterval = setInterval(() => {
      if (updatesRedsysOrdersChannel.current) {
        supabase.removeChannel(updatesRedsysOrdersChannel.current);
        updatesRedsysOrdersChannel.current = null;
        clearInterval(unsubscribeInterval);
      }
    }, 5000);
  };

  const onActivateTicket = () => {
    if (eventTicketOrderStatus !== 'PAYMENT_SUCCEDED') {
      return;
    }
    router.push(`/wallet/activateTicket/${walletTicket.id}`);
  };

  return (
    <>{ !eventTicketUsed && (eventTicketOrderStatus === 'PAYMENT_SUCCEDED' || eventTicketOrderStatus === 'PENDING_PAYMENT') ?
      <>{ eventTicketOrderStatus === 'PENDING_PAYMENT' ?
        <Pressable disabled style={[styles.singleTicketContainer, {opacity: .6, backgroundColor: Colors[theme].backgroundHalfOpacity}]}>
          <View style={styles.ticketIconWrapper}>
            <FontAwesomeIcon name="ticket" size={30} color={Colors['light'].text} />
          </View>
          <View style={styles.ticketNameWrapper}>
            <Text style={[styles.ticketName, {color: Colors['light'].text}]} numberOfLines={1}>{walletTicket.event_tickets_name}</Text>
            <Text style={[styles.ticketSubtitle, {fontSize: 10, color: theme === 'dark' ? 'lightgray' : 'gray'}]}>Processant pagament...</Text>
          </View>
        </Pressable>
        :
        <Pressable style={[styles.singleTicketContainer, {backgroundColor: Colors[theme].backgroundHalfOpacity}]} onPress={onActivateTicket}>
          <View style={styles.ticketIconWrapper}>
          <FontAwesomeIcon name="ticket" size={30} color={Colors['light'].text} />
        </View>
        <View style={styles.ticketNameWrapper}>
          <Text style={[styles.ticketName, {color: Colors['light'].text}]} numberOfLines={1}>{walletTicket.event_tickets_name}</Text>
          <Text style={[styles.ticketSubtitle, {color: theme === 'dark' ? 'lightgray' : 'gray'}]}>Activable</Text>
        </View>
      </Pressable>
      }</>
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
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderRadius: 10,
    margin: -2,
    borderStyle: 'dashed'
  },
  ticketNameWrapper: {
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