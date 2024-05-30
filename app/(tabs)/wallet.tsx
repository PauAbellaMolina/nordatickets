import { FlatList, StyleSheet } from 'react-native';
import { Text, View } from '../../components/Themed';
import WalletEventCardComponent from '../../components/WalletEventCardComponent';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from "../../supabase";
import { useSupabase } from '../../context/SupabaseProvider';
import { WalletTicket } from '../../types/supabaseplain';
import { RealtimeChannel } from '@supabase/realtime-js';

export default function TabTwoScreen() {
  const { user, i18n } = useSupabase();
  const [eventGroupedWalletTickets, setEventGroupedWalletTickets] = useState<WalletTicket[][]>([]);

  useEffect(() => {
    if (!user) return;
    let unmounted = false;
    fetchWalletTickets(unmounted);
    const subscription = subscribeWalletTickets(unmounted);

    return () => {
      unmounted = true;
      subscription?.unsubscribe();
    };
  }, [user]);

  const fetchWalletTickets = (unmounted: boolean) => {
    supabase.from('wallet_tickets').select().eq('user_id', user.id).is('used_at', null)
    .then(({ data: wallet_tickets, error }) => {
      if (unmounted || error) return;
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

  const subscribeWalletTickets = (unmounted: boolean): RealtimeChannel => {
    return supabase
    .channel('wallet_tickets')
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'wallet_tickets',
        filter: `user_id=eq.${user.id}`
      },
      (payload) => fetchWalletTickets(unmounted))
    .subscribe();
  };

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
