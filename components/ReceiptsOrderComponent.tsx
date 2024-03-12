import { FlatList, StyleSheet } from 'react-native';
import { View, Text } from "./Themed";
import { WalletTicket } from "../types/supabaseplain";

export default function ReceiptsOrderComponent({ order, eventName }: { order: WalletTicket[], eventName: string }) {

  return (
    <View style={styles.container}>
      <Text style={styles.orderTitle}>Transacció { order[0].order_id }</Text>
      <View style={styles.orderContent}>
        <Text style={styles.orderInfo}>{ new Date(order[0].created_at).toLocaleString([], {year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit'}) }h</Text>
        <Text style={styles.orderInfo}>{ eventName }</Text>
        <FlatList
          data={order}
          renderItem={({ item }) => <Text>{ item.event_tickets_name } - { item.price / 100 }€</Text>}
        />
      </View>
    </View>
  );

};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 12
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  orderContent: {
    backgroundColor: 'transparent',
    marginHorizontal: 8,
    gap: 8
  },
  orderInfo: {
    fontSize: 14
  }
});
