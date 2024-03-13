import { FlatList, StyleSheet } from 'react-native';
import { Text, View } from '../../components/Themed';
import WalletEventCardComponent from '../../components/WalletEventCardComponent';
import { useEffect, useState } from 'react';
import { supabase } from "../../supabase";
import { useSupabase } from '../../context/SupabaseProvider';
import { WalletTicket } from '../../types/supabaseplain';

export default function TabTwoScreen() {
  const { user } = useSupabase();

  const [eventGroupedWalletTickets, setEventGroupedWalletTickets] = useState<WalletTicket[][]>([]);

  useEffect(() => {
    if (!user) return;
    fetchWalletTickets();
    subscribeWalletTickets();
  }, [user]);

  const fetchWalletTickets = () => {
    supabase.from('wallet_tickets').select().eq('user_id', user.id).eq('used', false)
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

  const subscribeWalletTickets = () => {
    supabase
    .channel('wallet_tickets')
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'wallet_tickets',
        filter: `user_id=eq.${user.id}`
      },
      (payload) => fetchWalletTickets())
    .subscribe();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wallet</Text>
      <View style={styles.ticketsContainer}>
        <Text style={styles.ticketsTitle}>Tickets</Text>
        { eventGroupedWalletTickets?.length ?
          <FlatList
            style={styles.walletTicketList}
            data={eventGroupedWalletTickets}
            renderItem={({ item }) => <WalletEventCardComponent eventWalletTickets={item} />}
            ItemSeparatorComponent={() => <View style={{height: 10}} />}
          />
        :
          <Text style={styles.emptyWallet}>No tickets in wallet</Text>
        }
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingBottom: 5,
    paddingHorizontal: 15,
    flex: 1,
    overflow: 'scroll'
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold'
  },
  ticketsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 20
  },
  ticketsContainer: {
    marginTop: 30,
    marginHorizontal: 10
  },
  walletTicketList: {
    marginTop: 10
  },
  emptyWallet: {
    textAlign: 'center',
    color: 'grey',
    marginTop: 10
  }
});
