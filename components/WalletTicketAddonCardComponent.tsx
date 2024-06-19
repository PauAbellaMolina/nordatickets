import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Colors from '../constants/Colors';
import { Text, View } from './Themed';
import { EntypoIcon, FontAwesomeIcon } from './CustomIcons';
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
      if (triggerNextFocus.current) {
        if (!walletTicket || walletTicket?.used_at != null) return;
        fetchTicketOrderStatus();
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

  const fetchTicketOrderStatus = () => {
    supabase.from('redsys_orders').select().eq('order_id', walletTicket.order_id).single()
    .then(({ data: redsysOrder, error }) => {
      if (error) return;
      if (insertsRedsysOrdersChannel.current) {
        supabase.removeChannel(insertsRedsysOrdersChannel.current);
        insertsRedsysOrdersChannel.current = null;
      }
      if (!redsysOrder) {
        subscribeRedsysOrdersInserts();
        return;
      }
      const status = redsysOrder.order_status;
      setEventTicketOrderStatus(status);
      const createdAt = new Date(walletTicket.created_at);
      const fiveSecondsAgo = new Date(new Date().getTime() - 5000);
      if (status === 'PENDING_PAYMENT' && createdAt > fiveSecondsAgo) {
        if (updatesRedsysOrdersChannel.current) {
          supabase.removeChannel(updatesRedsysOrdersChannel.current);
          updatesRedsysOrdersChannel.current = null;
        }
        setShouldDisplayPendingTicket(true);
        subscribeRedsysOrdersUpdates();
      }
      if (updatesRedsysOrdersChannel.current && (redsysOrder.order_status === 'PAYMENT_SUCCEEDED' || redsysOrder.order_status === 'PAYMENT_FAILED')) {
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
    <>{ walletTicket?.used_at == null && (eventTicketOrderStatus === 'PAYMENT_SUCCEEDED' || (eventTicketOrderStatus === 'PENDING_PAYMENT')) ?
      <View style={styles.wrapperContainer}>
        <View style={[styles.singleTicketContainer, {opacity: eventTicketOrderStatus === 'PENDING_PAYMENT' ? .6 : 1 , backgroundColor: Colors[theme].backgroundHalfOpacity}]}>
          <View style={styles.ticketIconWrapper}>
            <EntypoIcon name="cup" size={30} color={Colors['light'].text} />
          </View>
          <View style={styles.ticketNameWrapper}>
            <Text style={[styles.ticketName, {color: Colors['light'].text}]} numberOfLines={1}>{walletTicket.event_tickets_name}</Text>
            <Text style={[styles.ticketSubtitle, {color: theme === 'dark' ? 'lightgray' : 'gray'}]}>{ eventTicketOrderStatus === 'PENDING_PAYMENT' ? shouldDisplayPendingTicket ? i18n?.t('paymentProcessing')+'...' : i18n?.t('paymentFailed') : i18n?.t('walletTicketAddonExplanation') }</Text>
          </View>
        </View>
        <View style={[styles.separator, {backgroundColor: Colors[theme].contrastSeparatorBackgroundColor}]} />
      </View>
    : null }</>
  );
};

const styles = StyleSheet.create({
  wrapperContainer: {
    width: '100%',
    alignItems: 'center',
  },
  separator: {
    marginTop: 10,
    height: 1,
    width: '96%'
  },
  singleTicketContainer: {
    width: '100%',
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center'
  },
  ticketIconWrapper: {
    paddingVertical: 20,
    paddingHorizontal: 23,
    borderWidth: 2,
    borderRadius: 12,
    margin: -2
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