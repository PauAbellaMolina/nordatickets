import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Colors from '../constants/Colors';
import { Text, View } from './Themed';
import { FontAwesomeIcon } from './CustomIcons';
import { supabase } from "../supabase";
import { WalletTicket } from '../types/supabaseplain';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useSupabase } from '../context/SupabaseProvider';

export default function WalletTicketCardComponent({ walletTicket }: { walletTicket: WalletTicket }) {
  const { i18n, theme } = useSupabase();
  const [eventTicketOrderStatus, setEventTicketOrderStatus] = useState<string>();
  const [shouldDisplayPendingTicket, setShouldDisplayPendingTicket] = useState<boolean>(false);

  let insertsRedsysOrdersChannel = useRef<RealtimeChannel>();
  let updatesRedsysOrdersChannel = useRef<RealtimeChannel>();

  let triggerNextFocus = useRef<boolean>(true);

  useFocusEffect(
    useCallback(() => {
      let unmounted = false;
      if (triggerNextFocus.current) {
        if (!walletTicket || walletTicket?.used_at != null) return;
        fetchTicketOrderStatus(unmounted);
      }

      return () => {
        unmounted = true;
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

  const fetchTicketOrderStatus = (unmounted: boolean) => {
    supabase.from('redsys_orders').select().eq('order_id', walletTicket.order_id).single()
    .then(({ data: redsys_order, error }) => {
      if (error) return;
      if (insertsRedsysOrdersChannel.current) {
        supabase.removeChannel(insertsRedsysOrdersChannel.current);
        insertsRedsysOrdersChannel.current = null;
      }
      if (!redsys_order) {
        subscribeRedsysOrdersInserts();
        return;
      }
      const status = redsys_order.order_status;
      setEventTicketOrderStatus(status);
      const createdAt = new Date(walletTicket.created_at);
      const fiveSecondsAgo = new Date(new Date().getTime() - 5000);
      if (status === 'PAYMENT_PENDING' && createdAt > fiveSecondsAgo) {
        if (updatesRedsysOrdersChannel.current) {
          supabase.removeChannel(updatesRedsysOrdersChannel.current);
          updatesRedsysOrdersChannel.current = null;
        }
        setShouldDisplayPendingTicket(true);
        subscribeRedsysOrdersUpdates();
      }
      if (updatesRedsysOrdersChannel.current && (redsys_order.order_status === 'PAYMENT_SUCCEEDED' || redsys_order.order_status === 'PAYMENT_FAILED')) {
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
      (payload) => fetchTicketOrderStatus(false))
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
      (payload) => fetchTicketOrderStatus(false))
    .subscribe();

    updatesRedsysOrdersChannel.current = redsysOrdersChannel;

    const unsubscribeInterval = setInterval(() => {
      if (updatesRedsysOrdersChannel.current) {
        supabase.removeChannel(updatesRedsysOrdersChannel.current);
        updatesRedsysOrdersChannel.current = null;
        setShouldDisplayPendingTicket(false);
        clearInterval(unsubscribeInterval);
      }
    }, 5000);
  };

  const onActivateTicket = () => {
    if (eventTicketOrderStatus !== 'PAYMENT_SUCCEEDED') {
      return;
    }
    router.navigate(`/wallet/activateTicket/${walletTicket.id}`);
  };

  return (
    <>{ walletTicket?.used_at == null && (eventTicketOrderStatus === 'PAYMENT_SUCCEEDED' || (eventTicketOrderStatus === 'PAYMENT_PENDING')) ?
      <>{ eventTicketOrderStatus === 'PAYMENT_PENDING' ?
        <View style={[styles.singleTicketContainer, {opacity: .6, backgroundColor: Colors[theme].backgroundHalfOpacity}]}>
          <View style={styles.ticketIconWrapper}>
            <FontAwesomeIcon name="ticket" size={30} color={Colors['light'].text} />
          </View>
          <View style={styles.ticketNameWrapper}>
            <Text style={[styles.ticketName, {color: Colors['light'].text}]} numberOfLines={1}>{walletTicket.event_tickets_name}</Text>
            <Text style={[styles.ticketSubtitle, {fontSize: 10, color: theme === 'dark' ? 'lightgray' : 'gray'}]}>{ shouldDisplayPendingTicket ? i18n?.t('paymentProcessing')+'...' : i18n?.t('paymentFailed') }</Text>
          </View>
        </View>
        :
        <Pressable style={[styles.singleTicketContainer, {backgroundColor: Colors[theme].backgroundHalfOpacity}]} onPress={onActivateTicket}>
          <View style={styles.ticketIconWrapper}>
          <FontAwesomeIcon name="ticket" size={30} color={Colors['light'].text} />
        </View>
        <View style={styles.ticketNameWrapper}>
          <Text style={[styles.ticketName, {color: Colors['light'].text}]} numberOfLines={1}>{walletTicket.event_tickets_name}</Text>
          <Text style={[styles.ticketSubtitle, {color: theme === 'dark' ? 'lightgray' : 'gray'}]}>{ i18n?.t('activable') }</Text>
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
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center'
  },
  ticketIconWrapper: {
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderRadius: 12,
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