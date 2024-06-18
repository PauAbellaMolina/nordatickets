import { FlatList, StyleSheet } from 'react-native';
import { Text, View } from '../../components/Themed';
import WalletEventCardComponent from '../../components/WalletEventCardComponent';
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from "../../supabase";
import { useSupabase } from '../../context/SupabaseProvider';
import { WalletTicket } from '../../types/supabaseplain';
import { RealtimeChannel } from '@supabase/realtime-js';
import { useFocusEffect } from 'expo-router';

export default function TabTwoScreen() {
  const { user, i18n } = useSupabase();
  const [eventGroupedWalletTickets, setEventGroupedWalletTickets] = useState<WalletTicket[][]>([]);

  // let listenWalletTicketsChannel = useRef<RealtimeChannel>();

  let triggerNextFocus = useRef<boolean>(true);

  useFocusEffect( //TODO PAU test this change deeply
    useCallback(() => {
      if (triggerNextFocus.current) {
        if (!user) return;
        fetchWalletTickets();
        // subscribeWalletTickets(); //TODO PAU make super sure we don't need to subscribe for any use case and then remove the subscription code (commented out for now). If needed, activate wallet_tickets table realtime on supabase back on again.
      }

      return () => {
        triggerNextFocus.current = false;
        // if (listenWalletTicketsChannel.current) {
        //   supabase.removeChannel(listenWalletTicketsChannel.current);
        //   listenWalletTicketsChannel.current = null;
        // }
        setTimeout(() => {
          triggerNextFocus.current = true;
        }, 3000); //This is to prevent fetching every time we focus, just fetching when focused and after every 8 seconds
      };
    }, [user])
  );

  const fetchWalletTickets = () => {
    supabase.from('wallet_tickets').select().eq('user_id', user.id).is('used_at', null).order('is_addon', { ascending: false })
    .then(({ data: wallet_tickets, error }) => {
      if (error) return;
      const eventGroupedWalletTickets: WalletTicket[][] = 
      Object.values(
        wallet_tickets.reduce((groups, ticket) => {
          const { event_id } = ticket;
          if (!groups[event_id]) {
            groups[event_id] = [];
          }
          groups[event_id].push(ticket);
          return groups;
        }, {})
      );
      setEventGroupedWalletTickets(eventGroupedWalletTickets);
    });
  };

  // const subscribeWalletTickets = () => {
  //   const walletTicketsChannel = supabase
  //   .channel('wallet_tickets')
  //   .on('postgres_changes',
  //     {
  //       event: '*',
  //       schema: 'public',
  //       table: 'wallet_tickets',
  //       filter: `user_id=eq.${user.id}`
  //     },
  //     (payload) => fetchWalletTickets())
  //   .subscribe();

  //   listenWalletTicketsChannel.current = walletTicketsChannel
  // };

  const renderItem = useCallback(({item}: {item: WalletTicket[]}) => (
    <WalletEventCardComponent eventWalletTickets={item} />
  ), []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Wallet</Text>
          <Text style={styles.infoLabel}>{ i18n?.t('ticketsBoughtWillShowHereExplanation') }</Text>
        </View>
      </View>
      <View style={styles.ticketsContainer}>
        <Text style={styles.ticketsTitle}>Tickets</Text>
        { eventGroupedWalletTickets?.length ?
          <FlatList
            style={styles.walletTicketList}
            data={eventGroupedWalletTickets}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={{height: 10}} />}
          />
        :
          <Text style={styles.emptyWallet}>{ i18n?.t('noTicketsInWallet') }</Text>
        }
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    paddingBottom: 5,
    paddingHorizontal: 15,
    flex: 1,
    overflow: 'scroll'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 10
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  infoLabel: {
    fontSize: 13,
    marginLeft: 2,
    color: '#8C90A3'
  },
  ticketsContainer: {
    marginTop: 20,
    marginHorizontal: 5
  },
  ticketsTitle: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  walletTicketList: {
    marginTop: 10
  },
  emptyWallet: {
    textAlign: 'center',
    color: 'grey',
    marginTop: 50,
    fontStyle: 'italic'
  }
});
