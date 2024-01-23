import { FlatList, StyleSheet } from 'react-native';
// import { useWallet } from '../../context/WalletProvider';
import { Text, View } from '../../components/Themed';
import EventWalletTicketsCardComponent from '../../components/EventWalletTicketsCardComponent';
import { useEffect, useState } from 'react';
import { supabase } from "../../supabase";
import { useSupabase } from '../../context/SupabaseProvider';
import { WalletTickets } from '../../types/supabaseplain';

export default function TabTwoScreen() {
  // const { walletTicketGroups } = useWallet();
  const { user } = useSupabase();

  const [eventGroupedWalletTickets, setEventGroupedWalletTickets] = useState<WalletTickets[][]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('wallet_tickets').select().eq('user_id', user.id).eq('used', false) //TODO PAU make this realtime so that when a ticket is used it disappears from wallet (the bug on EventWalletTicketsCardComponent is accomplishing this fyi). and also probably to make tickets appear when order status is succeeded.
    .then(({ data: wallet_tickets, error }) => {
      if (error) return;
      const eventGroupedWalletTickets: WalletTickets[][] = 
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
  }, [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wallet</Text>
      <View style={styles.ticketsContainer}>
        <Text style={styles.ticketsTitle}>Tickets</Text>
        { eventGroupedWalletTickets?.length ?
          <FlatList
            style={styles.walletTicketList}
            data={eventGroupedWalletTickets}
            renderItem={({ item }) => <EventWalletTicketsCardComponent {...item} />}
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
    backgroundColor: 'transparent',
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
    backgroundColor: 'transparent',
    marginTop: 30,
    marginHorizontal: 10
  },
  walletTicketList: { //TODO PAU fix list underlapping tabs when list gets long
    marginTop: 10
  },
  emptyWallet: {
    textAlign: 'center',
    color: 'grey',
    marginTop: 10
  }
});
