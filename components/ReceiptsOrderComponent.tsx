import { FlatList, Pressable, StyleSheet, useColorScheme } from 'react-native';
import { View, Text } from "./Themed";
import { WalletTicket } from "../types/supabaseplain";
import Colors from '../constants/Colors';
import { router } from 'expo-router';
import { FeatherIcon } from './CustomIcons';

export default function ReceiptsOrderComponent({ order, eventName, eventTicketFee }: { order: WalletTicket[], eventName: string, eventTicketFee: number}) {
  const theme = useColorScheme() ?? 'light';

  const onGoToReceiptDetail = () => {
    router.push(`/profile/receipts/${order[0].order_id}`);
  }
  
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
        <View>
          <Text>Comissió: { eventTicketFee ? eventTicketFee * order.length / 100 : '...' }€</Text>
          <Text style={{fontWeight: 'bold'}}>Total: { (order.reduce((acc, ticket) => acc + ticket.price, 0) + eventTicketFee * order.length) / 100 || '...' }€</Text>
        </View>
      </View>
      <Pressable style={styles.goToReceiptContainer} onPress={onGoToReceiptDetail}>
        <FeatherIcon name="file-text" size={25} color={Colors[theme].text} />
      </Pressable>
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
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 10
  },
  orderInfo: {
    textAlign: 'right',
    fontSize: 14
  },
  goToReceiptContainer: {
    position: 'absolute',
    right: 15,
    bottom: 15
  }
});
