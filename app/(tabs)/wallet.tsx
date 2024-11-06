import { FlatList, StyleSheet } from 'react-native';
import { Text, View } from '../../components/Themed';
import WalletEventCardComponent from '../../components/WalletEventCardComponent';
import { useCallback, useRef, useState } from 'react';
import { supabase } from "../../supabase";
import { useSupabase } from '../../context/SupabaseProvider';
import { WalletTicket } from '../../types/supabaseplain';
import { useFocusEffect } from 'expo-router';

export default function TabTwoScreen() {
  const { user, i18n } = useSupabase();
  const [eventGroupedWalletTickets, setEventGroupedWalletTickets] = useState<WalletTicket[][]>([]);

  let triggerNextFocus = useRef<boolean>(true);

  useFocusEffect(
    useCallback(() => {
      let unmounted = false;
      if (triggerNextFocus.current) {
        if (!user) return;
        fetchWalletTickets(unmounted);
      }

      return () => {
        unmounted = true;
        triggerNextFocus.current = false;
        setTimeout(() => {
          triggerNextFocus.current = true;
        }, 1500); //This is to prevent fetching every time we focus, just fetching when focused and after every 1.5 seconds
      };
    }, [user])
  );

  const fetchWalletTickets = (unmounted: boolean) => {
    supabase.from('wallet_tickets').select().eq('user_id', user.id).is('used_at', null).is('refunded_at', null).order('type', { ascending: true })
    .then(({ data: wallet_tickets, error }) => {
      if (unmounted || error) return;
      const typeOrder = ['ADDON_REFUNDABLE', 'ADDON', 'ACCESS'];
      const typeOrderMap = new Map(typeOrder.map((type, index) => [type, index]));
      const orderedWalletTickets = wallet_tickets.sort((a, b) => {
        const aIndex = typeOrderMap.has(a.type) ? typeOrderMap.get(a.type) : typeOrder.length;
        const bIndex = typeOrderMap.has(b.type) ? typeOrderMap.get(b.type) : typeOrder.length;
        return aIndex - bIndex;
      });

      const eventGroupedWalletTickets: WalletTicket[][] = 
      Object.values(
        orderedWalletTickets.reduce((groups, ticket) => {
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
    paddingBottom: 95,
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
