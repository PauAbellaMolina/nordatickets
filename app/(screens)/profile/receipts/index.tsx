import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, useColorScheme } from 'react-native';
import { Text, View } from '../../../../components/Themed';
import GoBackArrow from '../../../../components/GoBackArrow';
import { useSupabase } from '../../../../context/SupabaseProvider';
import { WalletTicket } from '../../../../types/supabaseplain';
import { supabase } from '../../../../supabase';
import ReceiptsOrderComponent from '../../../../components/ReceiptsOrderComponent';

export default function ReceiptsScreen() {

  const theme = useColorScheme() ?? 'light';
  const { user } = useSupabase();

  const [orderIdGroupedWalletTickets, setOrderIdGroupedWalletTickets] = useState<WalletTicket[][]>([]);
  const [eventIdsNames, setEventIdsNames] = useState<{ id: number, name: string }[]>([]);
  const [eventIdsTicketFees, setEventIdsTicketFees] = useState<{ id: number, fee: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchWalletTickets();
  }, [user]);

  const fetchWalletTickets = () => { //TODO PAU the same useFocusEffect() stuff on WalletTicketCardComponent could be used here to optimize, but it's not as crucial as there
    supabase.from('wallet_tickets').select().eq('user_id', user.id).order('created_at', { ascending: false })
    .then(({ data: wallet_tickets, error }) => {
      if (error) return;
      const eventIds = [...new Set(wallet_tickets.map(ticket => ticket.event_id))];
      const orderIdGroupedWalletTickets: WalletTicket[][] = 
      Object.values(
        wallet_tickets.reduce((groups, ticket) => {
          const { order_id } = ticket;
          if (!groups[order_id]) {
            groups[order_id] = [];
          }
          groups[order_id].push(ticket);
          return groups;
        }, {})
      );

      const eventIdsNames: { id: number, name: string }[] = [];
      eventIds.forEach(eventId => {
        supabase.from('events').select().eq('id', eventId)
        .then(({ data: events, error }) => {
          if (error || !events.length) return;
          eventIdsNames.push({ id: eventId, name: events[0].name });
          eventIdsTicketFees.push({ id: eventId, fee: events[0].ticket_fee });
        });
      });

      setOrderIdGroupedWalletTickets(orderIdGroupedWalletTickets);
      setEventIdsNames(eventIdsNames);
    });
  };

  return (
    <View style={styles.container}>
      <GoBackArrow light={theme === 'dark'} />
      <Text style={styles.title}>Rebuts de compra</Text>
      <View style={styles.wrapper}>
        <FlatList
          data={orderIdGroupedWalletTickets}
          renderItem={({ item }) => <ReceiptsOrderComponent order={item} eventName={eventIdsNames.find(event => event.id === item[0].event_id)?.name} eventTicketFee={eventIdsTicketFees.find(event => event.id === item[0].event_id)?.fee} />}
          ItemSeparatorComponent={() => <View style={{height: 14}} />}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 75,
    paddingBottom: 5,
    paddingHorizontal: 15,
    flex: 1,
    overflow: 'scroll'
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold'
  },
  wrapper: {
    marginTop: 30,
    marginHorizontal: 2
  },
});