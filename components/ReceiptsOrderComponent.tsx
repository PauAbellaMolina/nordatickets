import { FlatList, StyleSheet, useColorScheme } from 'react-native';
import { View, Text } from "./Themed";
import { WalletTicket } from "../types/supabaseplain";
import Colors from '../constants/Colors';

export default function ReceiptsOrderComponent({ order, eventName, eventTicketFee }: { order: WalletTicket[], eventName: string, eventTicketFee: number}) {
  const theme = useColorScheme() ?? 'light';
  
  return (
    <View style={[styles.container, {backgroundColor: Colors[theme].backgroundContrast}]}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <View>
          <Text style={styles.orderTitle}>Identificador:</Text>
          <Text style={styles.orderTitle}>{ order[0].order_id }</Text>
        </View>
        <View>
          <Text style={styles.orderInfo}>{ new Date(order[0].created_at).toLocaleString([], {year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit'}) }h</Text>
          <Text style={styles.orderInfo}>{ eventName ? eventName : '...' }</Text>
        </View>
      </View>
      <View style={styles.orderContent}>
        <FlatList
          data={order}
          renderItem={({ item }) => <Text>{ item.event_tickets_name } - { item.price / 100 }€</Text>}
        />
        <View style={{alignSelf: 'flex-end'}}>
          <Text style={styles.orderInfo}>Comissió: { eventTicketFee ? eventTicketFee * order.length / 100 : '...' }€</Text>
          <Text style={[styles.orderInfo, {fontWeight: 'bold'}]}>Total: { (order.reduce((acc, ticket) => acc + ticket.price, 0) + eventTicketFee * order.length) / 100 }€</Text>
        </View>
      </View>
    </View>
  );

};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 10
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  orderContent: {
    marginHorizontal: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8
  },
  orderInfo: {
    textAlign: 'right',
    fontSize: 14
  }
});
