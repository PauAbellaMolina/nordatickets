import { FlatList, StyleSheet } from 'react-native';
import { useWallet } from '../../context/WalletProvider';
import { Text, View } from '../../components/Themed';
import WalletTicketGroupCardComponent from '../../components/walletTicketGroupCardComponent';
import { useEffect } from 'react';
import { supabase } from "../../supabase";
import { useSupabase } from '../../context/SupabaseProvider';

export default function TabTwoScreen() {
  const { walletTicketGroups } = useWallet();
  const { user } = useSupabase();

  useEffect(() => {
    if (!user) return;
    supabase.from('wallet_tickets').select().eq('user_id', user?.id)
    .then(({ data: wallet_tickets, error }) => {
      if (error) return;
      console.log("tab 2: ", wallet_tickets);
      // const userEventIdsFollowing = users[0].event_ids_following;
      // setUserEventIdsFollowing(userEventIdsFollowing);
      // supabase.from('events').select().in('id', userEventIdsFollowing)
      // .then(({ data: events, error }) => {
      //   if (error) return;
      //   setEvents(events);
      // });
    });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wallet</Text>
      <View style={styles.ticketsContainer}>
        <Text style={styles.ticketsTitle}>Tickets</Text>
        { walletTicketGroups?.length ?
          <FlatList
            style={styles.walletTicketList}
            data={walletTicketGroups}
            renderItem={({ item }) => <WalletTicketGroupCardComponent {...item} />}
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
